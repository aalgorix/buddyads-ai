import { NextResponse } from 'next/server';
import { prisma } from '@buddyads/db';

export const runtime = 'nodejs';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function asString(v: unknown): string {
  if (v == null) return '';
  if (Array.isArray(v)) return v.map(String).map((s) => s.trim()).filter(Boolean).join(', ');
  return String(v).trim();
}

function asPlatforms(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.map(String).map((s) => s.trim()).filter(Boolean);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const name = asString(body.name);
    const email = asString(body.email).toLowerCase();
    const phone = asString(body.phone) || null;
    const company = asString(body.company || body.companyName);
    let website = asString(body.website || body.websiteUrl);

    const businessDescription = asString(body.businessDescription);
    const productsServices = asString(body.productsServices);
    const idealCustomers = asString(body.idealCustomers);
    const countries = asString(body.countries);
    const competitors = asString(body.competitors);
    const marketingChallenge = asString(body.marketingChallenge);
    const aiPlatforms = asPlatforms(body.aiPlatforms);

    if (!name || !email || !website || !company) {
      return NextResponse.json(
        { message: 'Name, email, company, and website are required.' },
        { status: 400 },
      );
    }
    if (!EMAIL_RE.test(email)) {
      return NextResponse.json({ message: 'Valid email required.' }, { status: 400 });
    }
    if (!businessDescription || !productsServices || !idealCustomers) {
      return NextResponse.json(
        {
          message:
            'Please describe your business, products/services, and ideal customers so the agent can research better.',
        },
        { status: 400 },
      );
    }
    if (!/^https?:\/\//i.test(website)) website = `https://${website}`;
    try {
      const u = new URL(website);
      if (!['http:', 'https:'].includes(u.protocol)) throw new Error('bad protocol');
    } catch {
      return NextResponse.json({ message: 'Valid website URL required.' }, { status: 400 });
    }

    const intake = {
      websiteUrl: website,
      companyName: company,
      businessDescription,
      productsServices,
      idealCustomers,
      countries: countries || null,
      competitors: competitors || null,
      aiPlatforms,
      marketingChallenge: marketingChallenge || null,
      name,
      email,
      phone,
    };

    const result = await prisma.$transaction(async (tx) => {
      const customer = await tx.customer.create({
        data: {
          name,
          email,
          phone,
          company,
          website,
        },
      });
      const job = await tx.job.create({
        data: {
          customerId: customer.id,
          websiteUrl: website,
          intake: JSON.stringify(intake),
          status: 'PENDING',
          progressStep: 'pending',
        },
      });
      return { customer, job };
    });

    return NextResponse.json({
      message: 'Analysis started',
      jobId: result.job.id,
      status: result.job.status,
    });
  } catch (err) {
    console.error('[api/start]', err);
    return NextResponse.json(
      {
        message:
          err instanceof Error ? err.message : 'Could not start analysis. Is the database ready?',
      },
      { status: 503 },
    );
  }
}
