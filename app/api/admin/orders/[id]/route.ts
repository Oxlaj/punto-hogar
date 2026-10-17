import { NextResponse } from 'next/server';
import { prisma } from '../../../../../src/lib/prisma';
import { requirePermission } from '../../../../../src/lib/permissions';
import { logAudit } from '../../../../../src/lib/audit';

function err(status: number, code: string, message?: string) { return NextResponse.json({ error: message || code, code }, { status }); }

interface Params { params: { id: string } }

class OrderTransitionError extends Error {
  constructor(public code: string, message: string) {
    super(message);
    this.name = 'OrderTransitionError';
  }
}

export async function GET(_: Request, { params }: Params) {
  try {
    await requirePermission('order:read');
    const order = await prisma.order.findUnique({ where: { id: params.id }, include: { items: true, user: { select: { id: true, email: true } } } });
    if (!order) return err(404,'NOT_FOUND');
    const items = order.items.map(it => ({
      productName: it.name,
      productSlug: it.slug,
      productId: it.productId,
      qty: it.quantity,
      unitPrice: it.unitPrice,
      total: (it.quantity * Number(it.unitPrice))
    }));
    return NextResponse.json({
      id: order.id,
      status: order.status,
      customerName: order.customer,
      customerEmail: order.email,
      customerPhone: order.phone,
      customerAddress: order.address,
      subtotal: order.subtotal,
      total: order.total,
      createdAt: order.createdAt,
      userEmail: (order as any).user?.email || null,
      items
    });
  } catch (e:any) {
    if (e instanceof Error) {
      if (e.message === 'UNAUTHENTICATED') return err(401,'UNAUTHENTICATED');
      if (e.message === 'FORBIDDEN') return err(403,'FORBIDDEN');
    }
    return err(500,'SERVER_ERROR');
  }
}

export async function PATCH(req: Request, { params }: Params) {
  try {
    await requirePermission('order:manageStatus');
    const body = await req.json().catch(()=>({}));
    const nextStatusRaw = String(body.status || '').toUpperCase();
    const allowed = ['PENDING','PAID','SHIPPED','COMPLETED','CANCELED'];
    if (!allowed.includes(nextStatusRaw)) return err(400,'INVALID_STATUS');
    const result = await prisma.$transaction(async transaction => {
      const existing = await transaction.order.findUnique({ where: { id: params.id }, select: { status: true } });
      if (!existing) throw new OrderTransitionError('NOT_FOUND', 'Order not found');
      if (existing.status === nextStatusRaw) {
        return { unchanged: true, from: existing.status, to: existing.status, stockRestored: false };
      }
      if (existing.status === 'CANCELED') {
        throw new OrderTransitionError('CANCELED_ORDER_TERMINAL', 'A canceled order cannot be reactivated.');
      }

      const transition = await transaction.order.updateMany({
        where: { id: params.id, status: { not: 'CANCELED' } },
        data: { status: nextStatusRaw as any }
      });
      if (transition.count !== 1) {
        const current = await transaction.order.findUnique({ where: { id: params.id }, select: { status: true } });
        if (current?.status === 'CANCELED') {
          if (nextStatusRaw === 'CANCELED') {
            return { unchanged: true, from: current.status, to: current.status, stockRestored: false };
          }
          throw new OrderTransitionError('CANCELED_ORDER_TERMINAL', 'A canceled order cannot be reactivated.');
        }
        throw new OrderTransitionError('STATUS_CONFLICT', 'The order status changed. Try again.');
      }

      if (nextStatusRaw === 'CANCELED') {
        const inventoryReservation = await transaction.auditLog.findFirst({
          where: {
            action: 'inventory.stock.decremented',
            entity: 'Order',
            entityId: params.id
          },
          select: { id: true }
        });
        if (inventoryReservation) {
          const items = await transaction.orderItem.findMany({
            where: { orderId: params.id },
            select: { productId: true, quantity: true }
          });
          for (const item of items) {
            await transaction.product.update({
              where: { id: item.productId },
              data: { stock: { increment: item.quantity } }
            });
          }
        }
        return {
          unchanged: false,
          from: existing.status,
          to: nextStatusRaw,
          stockRestored: Boolean(inventoryReservation)
        };
      }

      return { unchanged: false, from: existing.status, to: nextStatusRaw, stockRestored: false };
    });

    if (result.unchanged) return NextResponse.json({ ok: true, unchanged: true });
    logAudit('order.status.update','Order', params.id, {
      from: result.from,
      to: result.to,
      stockRestored: result.stockRestored === true
    });
    return NextResponse.json({ ok: true, from: result.from, to: result.to });
  } catch (e:any) {
    if (e instanceof Error) {
      if (e.message === 'UNAUTHENTICATED') return err(401,'UNAUTHENTICATED');
      if (e.message === 'FORBIDDEN') return err(403,'FORBIDDEN');
      if (e instanceof OrderTransitionError) {
        if (e.code === 'NOT_FOUND') return err(404, e.code, e.message);
        return err(409, e.code, e.message);
      }
    }
    return err(500,'SERVER_ERROR');
  }
}

export async function PUT(req: Request, ctx: Params) {
  // alias for PATCH to support mobile contract
  return PATCH(req, ctx);
}
