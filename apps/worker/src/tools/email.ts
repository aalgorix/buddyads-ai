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
          <strong>AI Visibility:</strong> ${params.overall}
          &nbsp;·&nbsp; <strong>AEO:</strong> ${params.aeo ?? '—'}
          &nbsp;·&nbsp; <strong>GEO:</strong> ${params.geo ?? '—'}
        </p>`;

  try {
    const resend = new Resend(key);
    const from = getFromEmail();
    const result = await resend.emails.send({
      from,
      to: params.to,
      subject: 'Your AI Visibility Intelligence Report is ready',
      html: `
        <div style="font-family:Inter,Segoe UI,Arial,sans-serif;max-width:560px;margin:0 auto;color:#111;line-height:1.5">
          <div style="padding:20px 0 8px;border-bottom:1px solid #eee">
            <p style="margin:0;font-size:13px;color:#2563eb;font-weight:700">BuddyAds</p>
            <h1 style="margin:8px 0 0;font-size:22px;line-height:1.25">Your AI Visibility Report is ready</h1>
          </div>
          <p style="margin-top:20px">Hello ${params.name},</p>
          <p>Thanks for using <strong>BuddyAds</strong>.</p>
          <p>We've finished the <strong>AI Visibility Intelligence Report</strong> for <strong>${brand}</strong> — how AI sees, understands, recommends, and cites your brand.</p>
          ${scoresRow}
          <p>Inside your report you'll discover:</p>
          <ul style="padding-left:18px;color:#333">
            <li>AI Visibility, on-site AI-readiness, and platform performance</li>
            <li>What AI recommends instead of you</li>
            <li>Citation and competitor gaps</li>
            <li>AEO, GEO, and technical AI readiness</li>
            <li>A 7-day, 30-day, and 90-day plan</li>
          </ul>
          <p style="margin:28px 0 12px">
            <a href="${params.reportUrl}" style="background:#111;color:#fff;padding:12px 22px;border-radius:999px;text-decoration:none;display:inline-block;font-weight:600">View Report</a>
          </p>
          <p style="margin:0 0 24px">
            <a href="${bookCallUrl}" style="color:#2563eb;font-weight:600;text-decoration:none">Book a Free AI Strategy Call →</a>
          </p>
          <p style="color:#6b7280;font-size:12px;border-top:1px solid #eee;padding-top:16px">
            AI Visibility and On-site AI-readiness are proprietary BuddyAds.ai measurements from sampled AI answers and crawled website signals. They are not internal ranking scores from OpenAI, Google, Anthropic, Perplexity, or any other AI provider.
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

