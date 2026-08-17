import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Returns a short-lived signed WebSocket URL for a private ElevenLabs agent.
 * Keeps ELEVENLABS_API_KEY on the server.
 */
export async function GET() {
  const apiKey = process.env.ELEVENLABS_API_KEY?.trim();
  const agentId = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID?.trim();

  if (!apiKey || !agentId) {
    return NextResponse.json(
      {
        code: 'ELEVENLABS_NOT_CONFIGURED',
        message:
          'Set ELEVENLABS_API_KEY and NEXT_PUBLIC_ELEVENLABS_AGENT_ID to enable Conversational AI.',
      },
      { status: 503 },
    );
  }

  try {
    const url = new URL('https://api.elevenlabs.io/v1/convai/conversation/get-signed-url');
    url.searchParams.set('agent_id', agentId);

    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'xi-api-key': apiKey,
      },
      cache: 'no-store',
    });

    const data = (await res.json().catch(() => null)) as
      | { signed_url?: string; detail?: unknown }
      | null;

    if (!res.ok || !data?.signed_url) {
      console.error('[elevenlabs/signed-url]', res.status, data);
      return NextResponse.json(
        {
          code: 'SIGNED_URL_FAILED',
          message: 'Could not create ElevenLabs conversation URL.',
        },
        { status: 502 },
      );
    }

    return NextResponse.json({ signedUrl: data.signed_url });
  } catch (err) {
    console.error('[elevenlabs/signed-url]', err);
    return NextResponse.json(
      {
        code: 'SIGNED_URL_FAILED',
        message: 'Could not reach ElevenLabs.',
      },
      { status: 502 },
    );
  }
}
