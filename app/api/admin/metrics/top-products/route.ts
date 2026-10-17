import { NextResponse } from 'next/server';
import { requirePermission } from '../../../../../src/lib/permissions';
import { getTopProducts, normalizeRange } from '../../../../../src/lib/metrics';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  try {
    await requirePermission('dashboard:access');
    const { searchParams } = new URL(req.url);
    const range = normalizeRange({ from: searchParams.get('from') || undefined, to: searchParams.get('to') || undefined, g: searchParams.get('g') || undefined });
    const limit = Number(searchParams.get('limit') || 10);
    const products = await getTopProducts(range, limit > 0 && limit < 100 ? limit : 10);
    return NextResponse.json({ range: { from: range.from.toISOString().slice(0,10), to: range.to.toISOString().slice(0,10) }, products });
  } catch (e: any) {
    if (e instanceof Error) {
      if (e.message === 'UNAUTHENTICATED') return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 });
      if (e.message === 'FORBIDDEN') return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
    }
    return NextResponse.json({ error: 'SERVER_ERROR' }, { status: 500 });
  }
}