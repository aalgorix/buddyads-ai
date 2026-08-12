import { Resend } from 'resend';
import { env, getPublicAppUrl } from '../env';

export async function sendReportEmail(params: {
  to: string;
  name: string;
  brandName: string;
  reportUrl: string;
  overall: number;
}): Promise<{ status: 'SENT' | 'SKIPPED' | 'FAILED'; id?: string; error?: string }> {
  const key = env('RESEND_API_KEY');
  if (!key) {
    return { status: 'SKIPPED', error: 'RESEND_API_KEY not set' };
  }

  try {
    const resend = new Resend(key);
    const from = env('FROM_EMAIL', 'BuddyAds <onboarding@resend.dev>');
    const result = await resend.emails.send({
      from,
      to: params.to,
      subject: `Your ${params.brandName} AI Visibility Report is ready`,
      html: `
        <div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;color:#141414;line-height:1.5">
          <p style="letter-spacing:0.12em;text-transform:uppercase;font-size:12px;color:#9a5b2e">BuddyAds</p>
          <h1 style="font-size:26px;line-height:1.2">Your visibility report is ready</h1>
          <p>Hi ${params.name},</p>
          <p>We finished analyzing <strong>${params.brandName}</strong>. Overall AI Visibility score: <strong>${params.overall}</strong>.</p>
          <p><a href="${params.reportUrl}" style="display:inline-block;background:#141414;color:#fff;padding:12px 20px;text-decoration:none">Open report</a></p>
          <p style="color:#666;font-size:13px">Link: ${params.reportUrl}</p>
          <p style="color:#666;font-size:12px">— BuddyAds</p>
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
