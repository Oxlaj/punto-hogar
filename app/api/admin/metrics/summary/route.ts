import { NextResponse } from 'next/server';
import { requirePermission } from '../../../../../src/lib/permissions';
import { getSummaryMetrics, normalizeRange } from '../../../../../src/lib/metrics';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  try {
    await requirePermission('dashboard:access');
    const { searchParams } = new URL(req.url);
    const range = normalizeRange({ from: searchParams.get('from') || undefined, to: searchParams.get('to') || undefined, g: searchParams.get('g') || undefined });
    const summary = await getSummaryMetrics(range);
    return NextResponse.json(summary);
  } catch (e: any) {
    if (e instanceof Error) {
      if (e.message === 'UNAUTHENTICATED') return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 });
      if (e.message === 'FORBIDDEN') return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
    }
    return NextResponse.json({ error: 'SERVER_ERROR' }, { status: 500 });
  }
}