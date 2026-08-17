import { isIP } from 'node:net';
import { lookup } from 'node:dns/promises';

const BLOCKED_HOSTS = new Set(['localhost', 'metadata.google.internal']);

function isPrivateIp(ip: string): boolean {
  if (ip === '::1' || ip.startsWith('fe80:') || ip.startsWith('fc') || ip.startsWith('fd')) return true;
  const parts = ip.split('.').map(Number);
  if (parts.length !== 4 || parts.some((n) => Number.isNaN(n))) return false;
  const [a, b] = parts;
  return (
    a === 10 ||
    a === 127 ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    a === 0
  );
}

export async function assertSafeUrl(url: string): Promise<URL> {
  let parsed: URL;
  try {
    parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
  } catch {
    throw new Error('Invalid URL');
  }
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error('Only http and https URLs are supported');
  }
  const host = parsed.hostname.toLowerCase().replace(/\.$/, '');
  if (!host || BLOCKED_HOSTS.has(host) || host.endsWith('.localhost') || host.endsWith('.local')) {
    throw new Error('That host cannot be audited');
  }
  if (isIP(host) && isPrivateIp(host)) {
    throw new Error('Private or local network URLs are not allowed');
  }
  try {
    const { address } = await lookup(host);
    if (isPrivateIp(address)) throw new Error('Private or local network URLs are not allowed');
  } catch (err) {
    if (err instanceof Error && err.message.includes('Private')) throw err;
    throw new Error('Could not resolve that domain');
  }
  return parsed;
}
