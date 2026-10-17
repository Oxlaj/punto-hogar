import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth-server';

function err(status: number, code: string, message?: string) {
  return NextResponse.json({ error: message || code, code }, { status });
}

interface Params { params: { id: string } }

export async function GET(_: Request, { params }: Params) {
  try {
    const user = await getCurrentUser();
    if (!user) return err(401, 'UNAUTHENTICATED');
    // @ts-ignore prisma types stale
    const order = await prisma.order.findFirst({ where: { id: params.id, userId: user.id }, include: { items: true } });
    if (!order) return err(404, 'NOT_FOUND');
    const items = order.items.map(it => ({
      productId: it.productId,
      name: it.name,
      slug: it.slug,
      qty: it.quantity,
      unitPrice: it.unitPrice,
      total: Number(it.unitPrice) * it.quantity,
    }));
    return NextResponse.json({
      id: order.id,
      status: order.status,
      createdAt: order.createdAt,
      customerName: order.customer,
      customerEmail: order.email,
      customerPhone: order.phone,
      customerAddress: order.address,
      subtotal: order.subtotal,
      total: order.total,
      items,
    });
  } catch (e) {
    return err(500, 'SERVER_ERROR');
  }
}
