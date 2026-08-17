/** Map OpenRouter model ids to buyer-facing AI platform names. */

const RULES: { test: (m: string) => boolean; label: string }[] = [
  { test: (m) => m.includes('perplexity'), label: 'Perplexity' },
  { test: (m) => m.includes('gemini') || m.startsWith('google/'), label: 'Gemini' },
  { test: (m) => m.includes('claude') || m.startsWith('anthropic/'), label: 'Claude' },
  { test: (m) => m.includes('grok') || m.startsWith('x-ai/') || m.startsWith('xai/'), label: 'Grok' },
  { test: (m) => m.includes('copilot'), label: 'Copilot' },
  { test: (m) => m.includes('mistral'), label: 'Mistral' },
  { test: (m) => m.includes('deepseek'), label: 'DeepSeek' },
  { test: (m) => m.includes('openai') || m.includes('gpt'), label: 'ChatGPT' },
];

export function platformFromModel(model: string): string {
  const m = (model || '').toLowerCase();
  for (const rule of RULES) {
    if (rule.test(m)) return rule.label;
  }
  const vendor = model.split('/')[0]?.trim();
  if (vendor) return vendor.charAt(0).toUpperCase() + vendor.slice(1);
  return model || 'Unknown';
}

export function shortModelName(model: string): string {
  const part = model.split('/').pop() || model;
  return part.replace(/:.*$/, '');
}
