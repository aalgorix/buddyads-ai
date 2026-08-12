import { Resend } from 'resend';
import { env, getBookCallUrl, getFromEmail, getPublicAppUrl } from '../env';

export async function sendReportEmail(params: {
  to: string;
  name: string;
  brandName: string;
  reportUrl: string;
  overall: number;
  aeo?: number;
  geo?: number;
  bookCallUrl?: string;
}): Promise<{ status: 'SENT' | 'SKIPPED' | 'FAILED'; id?: string; error?: string }> {
  const key = env('RESEND_API_KEY');
  if (!key || key.includes('xxxxx') || key.length < 10) {
    return { status: 'SKIPPED', error: 'RESEND_API_KEY not configured' };
  }

  const bookCallUrl = params.bookCallUrl || getBookCallUrl();
  const brand = params.brandName || 'your brand';
  const scoresRow = `<p style="margin:16px 0;padding:14px 16px;background:#f4f7fb;border-radius:12px;font-size:14px">
          <strong>Overall:</strong> ${params.overall}
          &nbsp;·&nbsp; <strong>AEO:</strong> ${params.aeo ?? '—'}
          &nbsp;·&nbsp; <strong>GEO:</strong> ${params.geo ?? '—'}
        </p>`;

  try {
    const resend = new Resend(key);
    const from = getFromEmail();
    const result = await resend.emails.send({
      from,
      to: params.to,
      subject: 'Your BuddyAds AI Visibility Report is Ready',
      html: `
        <div style="font-family:Inter,Segoe UI,Arial,sans-serif;max-width:560px;margin:0 auto;color:#111;line-height:1.5">
          <div style="padding:20px 0 8px;border-bottom:1px solid #eee">
            <p style="margin:0;font-size:13px;color:#2563eb;font-weight:700">BuddyAds</p>
            <h1 style="margin:8px 0 0;font-size:22px;line-height:1.25">Your AI Visibility Report is ready</h1>
          </div>
          <p style="margin-top:20px">Hello ${params.name},</p>
          <p>Thanks for using <strong>BuddyAds</strong>.</p>
          <p>We've finished analyzing <strong>${brand}</strong> for Answer Engine Optimization (AEO), Generative Engine Optimization (GEO), and LLM readiness.</p>
          ${scoresRow}
          <p>Inside your report you'll discover:</p>
          <ul style="padding-left:18px;color:#333">
            <li>AI Visibility Score</li>
            <li>AEO Score &amp; GEO Score</li>
            <li>Key issues blocking AI citations</li>
            <li>Prioritized opportunities</li>
            <li>30-day and 90-day action plans</li>
            <li>Competitor insights</li>
          </ul>
          <p style="margin:28px 0 12px">
            <a href="${params.reportUrl}" style="background:#111;color:#fff;padding:12px 22px;border-radius:999px;text-decoration:none;display:inline-block;font-weight:600">View Report</a>
          </p>
          <p style="margin:0 0 24px">
            <a href="${bookCallUrl}" style="color:#2563eb;font-weight:600;text-decoration:none">Book a Free AI Strategy Call →</a>
          </p>
          <p style="color:#6b7280;font-size:12px;border-top:1px solid #eee;padding-top:16px">
            LLM-related scores are evidence-based estimates from publicly observable website signals and sampled model answers — not direct measurements of how ChatGPT, Gemini, Claude, or other models internally rank sites.
          </p>
          <p style="color:#6b7280;font-size:13px">— The BuddyAds Team</p>
        </div>
      `,
    });
    if (result.error) return { status: 'FAILED', error: result.error.message };
    return { status: 'SENT', id: result.data?.id };
  } catch (err) {
    return { status: 'FAILED', error: err instanceof Error ? err.message : 'Email failed' };
  }
}

export function reportUrlForToken(token: string): string {
  return `${getPublicAppUrl()}/report/${token}`;
}
