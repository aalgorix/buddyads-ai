import path from 'node:path';
import { config } from 'dotenv';

config({ path: path.resolve(__dirname, '../../../.env') });
config({ path: path.resolve(process.cwd(), '.env') });

export function env(name: string, fallback = ''): string {
  return (process.env[name] || fallback).trim();
}

/** Prefer AdGenix-style alias, then BuddyAds name. */
export function envAlias(primary: string, alias: string, fallback = ''): string {
  return env(primary) || env(alias) || fallback;
}

export function getModels(): string[] {
  const raw = env(
    'OPENROUTER_MODELS',
    'openai/gpt-4o-mini,google/gemini-2.0-flash-001,anthropic/claude-3.5-haiku',
  );
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 5);
}

/**
 * Map intake AI platform ids → OpenRouter model ids, intersected with OPENROUTER_MODELS when possible.
 */
export function modelsForPlatforms(platforms?: string[] | null): string[] {
  const all = getModels();
  if (!platforms?.length) return all;

  const map: Record<string, string[]> = {
    chatgpt: ['openai/gpt-4o-mini', 'openai/gpt-4o', 'openai/'],
    gemini: ['google/gemini', 'google/'],
    claude: ['anthropic/claude', 'anthropic/'],
    perplexity: ['perplexity/'],
    copilot: ['openai/'],
    grok: ['x-ai/grok', 'xai/'],
  };

  const picked: string[] = [];
  for (const p of platforms) {
    const prefixes = map[p.toLowerCase()] || [];
    for (const model of all) {
      if (prefixes.some((pre) => model.startsWith(pre) || model.includes(pre)) && !picked.includes(model)) {
        picked.push(model);
      }
    }
  }
  return picked.length ? picked : all;
}

export function getPublicAppUrl(): string {
  return envAlias('PUBLIC_APP_URL', 'VISIBILITY_PUBLIC_APP_URL', 'http://localhost:3005').replace(
    /\/$/,
    '',
  );
}

export function getFromEmail(): string {
  return envAlias(
    'VISIBILITY_FROM_EMAIL',
    'FROM_EMAIL',
    'BuddyAds <onboarding@resend.dev>',
  );
}

export function getBookCallUrl(): string {
  return `${getPublicAppUrl()}/contact`;
}
