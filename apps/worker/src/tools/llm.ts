import { env, getModels, modelsForPlatforms } from '../env';

export type LlmAnswer = {
  model: string;
  question: string;
  answer: string;
  brandMentioned: boolean;
  error?: string;
};

async function openRouterChat(
  model: string,
  messages: { role: 'system' | 'user' | 'assistant'; content: string }[],
): Promise<string> {
  const key = env('OPENROUTER_API_KEY');
  if (!key) throw new Error('OPENROUTER_API_KEY not set');

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': env('OPENROUTER_HTTP_REFERER', env('PUBLIC_APP_URL', 'https://buddyads.agency')),
      'X-Title': env('OPENROUTER_APP_TITLE', 'BuddyAds AI Visibility'),
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.4,
      max_tokens: 900,
    }),
    signal: AbortSignal.timeout(90_000),
  });

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
    error?: { message?: string };
  };

  if (!res.ok) {
    throw new Error(data.error?.message || `OpenRouter HTTP ${res.status}`);
  }

  return data.choices?.[0]?.message?.content?.trim() || '';
}

function detectMention(answer: string, brand: string): boolean {
  if (!brand || !answer) return false;
  const a = answer.toLowerCase();
  const b = brand.toLowerCase();
  if (a.includes(b)) return true;
  const token = b.split(/\s+/)[0];
  return token.length >= 4 && a.includes(token);
}

export async function queryLlm(params: {
  question: string;
  brandName: string;
  model?: string;
}): Promise<LlmAnswer> {
  const model = params.model || getModels()[0];
  try {
    const answer = await openRouterChat(model, [
      {
        role: 'system',
        content:
          'You are a helpful research assistant. Answer clearly and specifically. Name real companies you would recommend when relevant. Do not invent fake citation URLs.',
      },
      { role: 'user', content: params.question },
    ]);
    return {
      model,
      question: params.question,
      answer,
      brandMentioned: detectMention(answer, params.brandName),
    };
  } catch (err) {
    return {
      model,
      question: params.question,
      answer: '',
      brandMentioned: false,
      error: err instanceof Error ? err.message : 'LLM query failed',
    };
  }
}

export async function queryAllModels(params: {
  question: string;
  brandName: string;
  platforms?: string[] | null;
}): Promise<LlmAnswer[]> {
  const models = modelsForPlatforms(params.platforms);
  if (!env('OPENROUTER_API_KEY')) {
    return models.map((model) => ({
      model,
      question: params.question,
      answer: '',
      brandMentioned: false,
      error: 'OPENROUTER_API_KEY not configured',
    }));
  }

  const concurrency = Math.max(1, Number(env('LLM_RESEARCH_CONCURRENCY', '3')) || 3);
  const out: LlmAnswer[] = [];
  for (let i = 0; i < models.length; i += concurrency) {
    const batch = models.slice(i, i + concurrency);
    const results = await Promise.all(batch.map((model) => queryLlm({ ...params, model })));
    out.push(...results);
  }
  return out;
}

export async function agentPlan(system: string, user: string): Promise<string> {
  const model = env('AGENT_MODEL', getModels()[0] || 'openai/gpt-4o-mini');
  if (!env('OPENROUTER_API_KEY')) {
    throw new Error('OPENROUTER_API_KEY required for agent planning');
  }
  return openRouterChat(model, [
    { role: 'system', content: system },
    { role: 'user', content: user },
  ]);
}

export { openRouterChat };
