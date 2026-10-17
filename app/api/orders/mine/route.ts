import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth-server';

function err(status: number, code: string, message?: string) {
  return NextResponse.json({ error: message || code, code }, { status });
}

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return err(401, 'UNAUTHENTICATED');

    const { searchParams } = new URL(req.url);
    const page = Math.max(parseInt(searchParams.get('page') || '1', 10) || 1, 1);
    const per = Math.min(Math.max(parseInt(searchParams.get('per') || searchParams.get('limit') || '20', 10) || 20, 1), 100);
    const status = (searchParams.get('status') || '').toUpperCase();

    const where: any = { userId: user.id };
    if (status) where.status = status;

    const [total, orders] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * per,
        take: per,
        include: { items: true },
      })
    ]);

    const items = orders.map(o => ({
      id: o.id,
      status: o.status,
      createdAt: o.createdAt,
      subtotal: o.subtotal,
      total: o.total,
      itemsCount: o.items.reduce((a,b)=> a + b.quantity, 0),
    }));

    return NextResponse.json({ items, page, per, total, totalPages: Math.max(1, Math.ceil(total / per)) });
  } catch (e) {
    return err(500, 'SERVER_ERROR');
  }
}
