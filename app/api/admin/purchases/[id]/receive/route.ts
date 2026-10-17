import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '../../../../../../src/lib/prisma';
import { requireAdministrator, requirePermission } from '../../../../../../src/lib/permissions';
import { logAudit } from '../../../../../../src/lib/audit';

class ReceiptError extends Error {
  constructor(public code: string, message: string) { super(message); }
}
function response(status: number, code: string, error = code) { return NextResponse.json({ error, code }, { status }); }
function authError(error: unknown) {
  if (error instanceof Error && error.message === 'UNAUTHENTICATED') return response(401, 'UNAUTHENTICATED');
  if (error instanceof Error && error.message === 'FORBIDDEN') return response(403, 'FORBIDDEN');
  return null;
}

export async function POST(_: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireAdministrator();
    await requirePermission('purchase:receive');
    const result = await prisma.$transaction(async tx => {
      const claimed = await tx.purchase.updateMany({
        where: { id: params.id, status: 'PENDING' },
        data: { status: 'RECEIVED', receivedAt: new Date(), receivedById: user.id }
      });
      if (claimed.count !== 1) {
        const current = await tx.purchase.findUnique({ where: { id: params.id }, select: { status: true } });
        if (!current) throw new ReceiptError('NOT_FOUND', 'Compra no encontrada.');
        throw new ReceiptError('PURCHASE_ALREADY_RECEIVED', 'La compra ya fue recibida.');
      }
      const items = await tx.purchaseItem.findMany({ where: { purchaseId: params.id } });
      for (const item of items) {
        const inventoryQuantity = new Prisma.Decimal(item.purchaseQuantity).mul(item.conversionFactor);
        if (!inventoryQuantity.isInteger() || !inventoryQuantity.isPositive()) {
          throw new ReceiptError('INVALID_CONVERSION', 'La conversión de inventario no es válida.');
        }
        const quantity = inventoryQuantity.toNumber();
        await tx.product.update({ where: { id: item.productId }, data: { stock: { increment: quantity } } });
        await tx.inventoryMovement.create({
          data: {
            productId: item.productId,
            purchaseId: params.id,
            purchaseItemId: item.id,
            type: 'PURCHASE_RECEIPT',
            quantity,
            unitCost: item.unitCost,
            userId: user.id
          }
        });
      }
      return { itemCount: items.length };
    });
    await logAudit('purchase.receive', 'Purchase', params.id, { itemCount: result.itemCount });
    return NextResponse.json({ ok: true, status: 'RECEIVED', ...result });
  } catch (error) {
    const auth = authError(error);
    if (auth) return auth;
    if (error instanceof ReceiptError) return response(error.code === 'NOT_FOUND' ? 404 : 409, error.code, error.message);
    return response(500, 'SERVER_ERROR');
  }
}
