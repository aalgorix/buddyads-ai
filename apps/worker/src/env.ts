import path from 'node:path';
import { config } from 'dotenv';

config({ path: path.resolve(__dirname, '../../../.env') });
config({ path: path.resolve(process.cwd(), '.env') });

export function env(name: string, fallback = ''): string {
  return (process.env[name] || fallback).trim();
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

export function getPublicAppUrl(): string {
  return env('PUBLIC_APP_URL', 'http://localhost:3000').replace(/\/$/, '');
}
