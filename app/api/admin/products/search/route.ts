import { NextResponse } from 'next/server';
import { prisma } from '../../../../../src/lib/prisma';
import { requirePermission } from '../../../../../src/lib/permissions';

export async function GET(req: Request) {
  try {
    await requirePermission('product:read');
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get('q') || '').trim();
    const cat = (searchParams.get('cat') || '').trim();
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '10', 10) || 10, 1), 50);
    if (!q && !cat) return NextResponse.json([]);
    const where: any = {};
    if (q) {
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { id: { contains: q } },
        { slug: { contains: q, mode: 'insensitive' } }
      ];
    }
    if (cat) {
      where.AND = (where.AND || []).concat([{ OR: [ { categoryId: cat }, { category: { slug: cat } } ] }]);
    }
    const items = await prisma.product.findMany({
      where,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, slug: true, price: true, stock: true, category: { select: { id: true, name: true } } }
    });
    return NextResponse.json(items);
  } catch (e: any) {
    if (e instanceof Error) {
      if (e.message === 'UNAUTHENTICATED') return NextResponse.json({ error: 'UNAUTHENTICATED', code: 'UNAUTHENTICATED' }, { status: 401 });
      if (e.message === 'FORBIDDEN') return NextResponse.json({ error: 'FORBIDDEN', code: 'FORBIDDEN' }, { status: 403 });
    }
    return NextResponse.json({ error: 'SERVER_ERROR', code: 'SERVER_ERROR' }, { status: 500 });
  }
}
