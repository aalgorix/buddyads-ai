import { chatCompletionsQuery, envOr, isApiKeyConfigured, requireApiKey } from './http';
import { platformFromModel } from '../tools/platforms';

export type ProviderHit = {
  id: string;
  label: string;
  model: string;
  native: boolean;
};

export function listNativeProviders(): ProviderHit[] {
  const catalog: Array<{ id: string; label: string; env: string; model: string }> = [
    { id: 'openai', label: 'ChatGPT', env: 'OPENAI_API_KEY', model: envOr('OPENAI_CHAT_MODEL', 'gpt-4o-mini') },
    { id: 'gemini', label: 'Gemini', env: 'GEMINI_API_KEY', model: envOr('GEMINI_MODEL', 'gemini-2.0-flash') },
    { id: 'claude', label: 'Claude', env: 'ANTHROPIC_API_KEY', model: envOr('ANTHROPIC_MODEL', 'claude-sonnet-4-20250514') },
    { id: 'perplexity', label: 'Perplexity', env: 'PERPLEXITY_API_KEY', model: envOr('PERPLEXITY_MODEL', 'sonar') },
    { id: 'grok', label: 'Grok', env: 'XAI_API_KEY', model: envOr('XAI_MODEL', 'grok-2-latest') },
    { id: 'mistral', label: 'Mistral', env: 'MISTRAL_API_KEY', model: envOr('MISTRAL_MODEL', 'mistral-small-latest') },
    { id: 'deepseek', label: 'DeepSeek', env: 'DEEPSEEK_API_KEY', model: envOr('DEEPSEEK_MODEL', 'deepseek-chat') },
  ];
  return catalog
    .filter((p) => isApiKeyConfigured(p.env))
    .map((p) => ({ id: p.id, label: p.label, model: p.model, native: true }));
}

export function listOpenRouterModels(): string[] {
  const raw = envOr('OPENROUTER_MODELS', envOr('OPENROUTER_MODEL', 'openai/gpt-4o-mini'));
  return [...new Set(raw.split(',').map((s) => s.trim()).filter(Boolean))].slice(0, 6);
}

const PLATFORM_IDS: Record<string, string> = {
  chatgpt: 'ChatGPT',
  gemini: 'Gemini',
  claude: 'Claude',
  perplexity: 'Perplexity',
  copilot: 'Copilot',
  grok: 'Grok',
};

export function listResearchProviders(platforms?: string[] | null): ProviderHit[] {
  const native = listNativeProviders();
  const openRouterOnly = ['1', 'true', 'on'].includes((process.env.OPENROUTER_ONLY || '').toLowerCase());
  const out: ProviderHit[] = [];
  if (!openRouterOnly) out.push(...native);
  if (isApiKeyConfigured('OPENROUTER_API_KEY')) {
    for (const model of listOpenRouterModels()) {
      out.push({ id: `openrouter:${model}`, label: platformFromModel(model), model, native: false });
    }
  }
  const wanted = (platforms || []).map((p) => PLATFORM_IDS[p.toLowerCase()] || p);
  if (wanted.length && out.length) {
    const filtered = out.filter((p) => wanted.some((w) => p.label.toLowerCase() === w.toLowerCase()));
    if (filtered.length) return filtered;
  }
  const seen = new Set<string>();
  return out.filter((p) => {
    const key = `${p.label}:${p.native ? 'n' : 'o'}:${p.model}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function queryNative(id: string, prompt: string): Promise<string> {
  if (id === 'openai') {
    return chatCompletionsQuery({
      url: 'https://api.openai.com/v1/chat/completions',
      apiKey: requireApiKey('OPENAI_API_KEY'),
      model: envOr('OPENAI_CHAT_MODEL', 'gpt-4o-mini'),
      prompt,
    });
  }
  if (id === 'gemini') {
    const apiKey = requireApiKey('GEMINI_API_KEY');
    const model = envOr('GEMINI_MODEL', 'gemini-2.0-flash');
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.2 },
        }),
        signal: AbortSignal.timeout(90_000),
      },
    );
    if (!res.ok) throw new Error(`Gemini HTTP ${res.status}`);
    const data = (await res.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (!text) throw new Error('Gemini returned empty content');
    return text;
  }
  if (id === 'claude') {
    const apiKey = requireApiKey('ANTHROPIC_API_KEY');
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: envOr('ANTHROPIC_MODEL', 'claude-sonnet-4-20250514'),
        max_tokens: 900,
        temperature: 0.2,
        messages: [{ role: 'user', content: prompt }],
      }),
      signal: AbortSignal.timeout(90_000),
    });
    if (!res.ok) throw new Error(`Claude HTTP ${res.status}`);
    const data = (await res.json()) as { content?: { type?: string; text?: string }[] };
    const text = data.content?.find((c) => c.type === 'text')?.text?.trim();
    if (!text) throw new Error('Claude returned empty content');
    return text;
  }
  const map: Record<string, { url: string; env: string; model: string }> = {
    perplexity: { url: 'https://api.perplexity.ai/chat/completions', env: 'PERPLEXITY_API_KEY', model: envOr('PERPLEXITY_MODEL', 'sonar') },
    grok: { url: 'https://api.x.ai/v1/chat/completions', env: 'XAI_API_KEY', model: envOr('XAI_MODEL', 'grok-2-latest') },
    mistral: { url: 'https://api.mistral.ai/v1/chat/completions', env: 'MISTRAL_API_KEY', model: envOr('MISTRAL_MODEL', 'mistral-small-latest') },
    deepseek: { url: 'https://api.deepseek.com/chat/completions', env: 'DEEPSEEK_API_KEY', model: envOr('DEEPSEEK_MODEL', 'deepseek-chat') },
  };
  const spec = map[id];
  if (!spec) throw new Error(`Unknown provider ${id}`);
  return chatCompletionsQuery({
    url: spec.url,
    apiKey: requireApiKey(spec.env),
    model: spec.model,
    prompt,
  });
}

async function queryOpenRouter(model: string, prompt: string): Promise<string> {
  return chatCompletionsQuery({
    url: 'https://openrouter.ai/api/v1/chat/completions',
    apiKey: requireApiKey('OPENROUTER_API_KEY'),
    model,
    prompt,
    headers: {
      'HTTP-Referer': envOr('OPENROUTER_HTTP_REFERER', 'https://buddyads.agency'),
      'X-Title': envOr('OPENROUTER_APP_TITLE', 'BuddyAds AI Visibility'),
    },
  });
}

export async function queryProvider(provider: ProviderHit, prompt: string): Promise<string> {
  if (provider.native) return queryNative(provider.id, prompt);
  return queryOpenRouter(provider.model, prompt);
}
