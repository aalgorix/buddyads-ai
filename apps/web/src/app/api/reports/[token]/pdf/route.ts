import { readFile } from 'node:fs/promises';
import { NextResponse } from 'next/server';
import { prisma } from '@buddyads/db';

export const runtime = 'nodejs';

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ token: string }> },
) {
  const { token } = await ctx.params;
  const report = await prisma.report.findUnique({ where: { token } });
  if (!report?.pdfPath) {
    return NextResponse.json({ message: 'PDF not found' }, { status: 404 });
  }

  try {
    const bytes = await readFile(report.pdfPath);
    return new NextResponse(bytes, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="buddyads-visibility-${token.slice(0, 8)}.pdf"`,
      },
    });
  } catch {
    return NextResponse.json({ message: 'PDF file missing' }, { status: 404 });
  }
}
