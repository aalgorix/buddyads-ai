import type { ConsultantIntake } from './types';
import { validateEmail, validateWebsiteUrl } from './validation';

export async function submitStartAnalysis(
  intake: ConsultantIntake,
): Promise<{ analysisId: string }> {
  const res = await fetch('/api/start', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      website: intake.websiteUrl,
      company: intake.companyName,
      industry: intake.businessDescription,
      competitors: intake.competitors,
      email: intake.email,
      phone: intake.phone,
      name: intake.name,
      productsServices: intake.productsServices,
      idealCustomers: intake.idealCustomers,
      countries: intake.countries,
      marketingChallenge: intake.marketingChallenge,
      aiPlatforms: intake.aiPlatforms,
      websiteUrl: intake.websiteUrl,
      companyName: intake.companyName,
      businessDescription: intake.businessDescription,
    }),
  });

  const data = (await res.json().catch(() => null)) as
    | { analysisId?: string; jobId?: string; message?: string; code?: string }
    | null;

  if (!res.ok) {
    throw new Error(data?.message || 'Could not start analysis. Please try again.');
  }

  const analysisId = data?.analysisId || data?.jobId;
  if (!analysisId) {
    throw new Error('Analysis request succeeded but no analysisId was returned.');
  }

  return { analysisId };
}

export function assertIntakeReady(
  partial: Partial<ConsultantIntake>,
): ConsultantIntake | { error: string } {
  const website = validateWebsiteUrl(partial.websiteUrl || '');
  if (!website.valid) return { error: website.error };

  const email = validateEmail(partial.email || '');
  if (!email.valid) return { error: email.error };

  const required: (keyof ConsultantIntake)[] = [
    'companyName',
    'businessDescription',
    'productsServices',
    'idealCustomers',
    'countries',
    'competitors',
    'marketingChallenge',
    'name',
  ];

  for (const key of required) {
    const value = partial[key];
    if (typeof value !== 'string' || !value.trim()) {
      return { error: `Missing required field: ${key}` };
    }
  }

  if (!partial.aiPlatforms?.length) {
    return { error: 'Select at least one AI platform.' };
  }

  return {
    websiteUrl: website.url,
    companyName: partial.companyName!.trim(),
    businessDescription: partial.businessDescription!.trim(),
    productsServices: partial.productsServices!.trim(),
    idealCustomers: partial.idealCustomers!.trim(),
    countries: partial.countries!.trim(),
    competitors: partial.competitors!.trim(),
    aiPlatforms: partial.aiPlatforms,
    marketingChallenge: partial.marketingChallenge!.trim(),
    name: partial.name!.trim(),
    email: email.email,
    phone: partial.phone?.trim() || undefined,
  };
}
