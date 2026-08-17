export function requireApiKey(envName: string): string {
  const key = (process.env[envName] || '').trim();
  if (!key || key.includes('xxxxx') || key === 'sk-xxxxx') {
    throw new Error(`${envName} is not configured`);
  }
  return key;
}

export function envOr(name: string, fallback: string): string {
  return (process.env[name] || '').trim() || fallback;
}

export function isApiKeyConfigured(envName: string): boolean {
  const key = (process.env[envName] || '').trim();
  return Boolean(key) && !key.includes('xxxxx') && key !== 'sk-xxxxx';
}

export async function chatCompletionsQuery(params: {
  url: string;
  apiKey: string;
  model: string;
  prompt: string;
  headers?: Record<string, string>;
}): Promise<string> {
  const res = await fetch(params.url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${params.apiKey}`,
      'Content-Type': 'application/json',
      ...params.headers,
    },
    body: JSON.stringify({
      model: params.model,
      messages: [{ role: 'user', content: params.prompt }],
      temperature: 0.2,
      max_tokens: 900,
    }),
    signal: AbortSignal.timeout(90_000),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Provider HTTP ${res.status}: ${body.slice(0, 400)}`);
  }
  const data = (await res.json()) as { choices?: { message?: { content?: string | null } }[] };
  const text = data.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error('Provider returned empty content');
  return text;
}
