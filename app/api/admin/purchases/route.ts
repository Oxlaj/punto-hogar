import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '../../../../src/lib/prisma';
import { requireAdministrator, requirePermission } from '../../../../src/lib/permissions';
import { logAudit } from '../../../../src/lib/audit';
import { z } from 'zod';

export const runtime = 'nodejs';

const itemSchema = z.object({
  productId: z.string().min(1),
  purchaseQuantity: z.number().int().positive(),
  purchaseUnit: z.string().trim().min(1).max(40),
  inventoryUnit: z.string().trim().min(1).max(40),
  conversionFactor: z.number().positive(),
  unitCost: z.number().nonnegative()
});
const purchaseSchema = z.object({
  supplierId: z.string().min(1),
  purchaseDate: z.string().min(1),
  invoiceReference: z.string().trim().max(120).optional().nullable(),
  items: z.array(itemSchema).min(1)
});

function response(status: number, code: string, error = code) {
  return NextResponse.json({ error, code }, { status });
}
function authError(error: unknown) {
  if (error instanceof Error && error.message === 'UNAUTHENTICATED') return response(401, 'UNAUTHENTICATED');
  if (error instanceof Error && error.message === 'FORBIDDEN') return response(403, 'FORBIDDEN');
  return null;
}

export async function GET(request: Request) {
  try {
    await requireAdministrator();
    await requirePermission('purchase:read');
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q')?.trim() || '';
    const status = searchParams.get('status');
    const where: any = {};
    if (status === 'PENDING' || status === 'RECEIVED') where.status = status;
    if (q) where.OR = [
      { id: { contains: q } },
      { invoiceReference: { contains: q, mode: 'insensitive' } },
      { supplier: { businessName: { contains: q, mode: 'insensitive' } } }
    ];
    const purchases = await prisma.purchase.findMany({
      where,
      orderBy: { purchaseDate: 'desc' },
      include: { supplier: { select: { businessName: true } }, _count: { select: { items: true } } }
    });
    return NextResponse.json(purchases);
  } catch (error) {
    return authError(error) || response(500, 'SERVER_ERROR');
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAdministrator();
    await requirePermission('purchase:create');
    const parsed = purchaseSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return response(400, 'INVALID_PURCHASE', parsed.error.issues[0]?.message || 'Datos inválidos');
    const input = parsed.data;
    const date = new Date(input.purchaseDate);
    if (Number.isNaN(date.getTime())) return response(400, 'INVALID_DATE', 'La fecha de compra no es válida.');
    if (new Set(input.items.map(item => item.productId)).size !== input.items.length) {
      return response(400, 'DUPLICATE_PRODUCT', 'Un producto no puede repetirse en la compra.');
    }

    const purchase = await prisma.$transaction(async tx => {
      const supplier = await tx.supplier.findFirst({
        where: { id: input.supplierId, active: true },
        select: { id: true }
      });
      if (!supplier) throw new Error('INVALID_SUPPLIER');
      const links = await tx.productSupplier.findMany({
        where: { supplierId: supplier.id, productId: { in: input.items.map(item => item.productId) } },
        select: { productId: true }
      });
      if (links.length !== input.items.length) throw new Error('PRODUCT_NOT_ASSOCIATED');
      const products = await tx.product.findMany({
        where: { id: { in: input.items.map(item => item.productId) }, active: true },
        select: { id: true }
      });
      if (products.length !== input.items.length) throw new Error('INVALID_PRODUCT');

      let total = new Prisma.Decimal(0);
      const items = input.items.map(item => {
        const factor = new Prisma.Decimal(item.conversionFactor);
        const unitCost = new Prisma.Decimal(item.unitCost);
        const inventoryQuantity = factor.mul(item.purchaseQuantity);
        if (!inventoryQuantity.isInteger()) throw new Error('NON_INTEGER_CONVERSION');
        const lineTotal = unitCost.mul(item.purchaseQuantity);
        total = total.add(lineTotal);
        return {
          productId: item.productId,
          purchaseQuantity: item.purchaseQuantity,
          purchaseUnit: item.purchaseUnit,
          inventoryUnit: item.inventoryUnit,
          conversionFactor: factor,
          unitCost,
          lineTotal
        };
      });
      return tx.purchase.create({
        data: {
          supplierId: supplier.id,
          purchaseDate: date,
          invoiceReference: input.invoiceReference || null,
          total,
          createdById: user.id,
          items: { create: items }
        },
        include: { items: true }
      });
    });
    await logAudit('purchase.create', 'Purchase', purchase.id, { total: purchase.total.toString() });
    return NextResponse.json(purchase, { status: 201 });
  } catch (error: any) {
    const auth = authError(error);
    if (auth) return auth;
    const codes: Record<string, [number, string]> = {
      INVALID_SUPPLIER: [400, 'Proveedor activo no válido.'],
      PRODUCT_NOT_ASSOCIATED: [400, 'Todos los productos deben estar asociados al proveedor.'],
      INVALID_PRODUCT: [400, 'Solo se pueden comprar productos activos.'],
      NON_INTEGER_CONVERSION: [400, 'La conversión debe producir unidades enteras de inventario.']
    };
    if (error instanceof Error && codes[error.message]) return response(codes[error.message][0], error.message, codes[error.message][1]);
    return response(500, 'SERVER_ERROR');
  }
}
