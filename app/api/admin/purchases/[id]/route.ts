import { NextResponse } from 'next/server';
import { prisma } from '../../../../../src/lib/prisma';
import { requireAdministrator, requirePermission } from '../../../../../src/lib/permissions';

function response(status: number, code: string, error = code) { return NextResponse.json({ error, code }, { status }); }
function authError(error: unknown) {
  if (error instanceof Error && error.message === 'UNAUTHENTICATED') return response(401, 'UNAUTHENTICATED');
  if (error instanceof Error && error.message === 'FORBIDDEN') return response(403, 'FORBIDDEN');
  return null;
}

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    await requireAdministrator();
    await requirePermission('purchase:read');
    const purchase = await prisma.purchase.findUnique({
      where: { id: params.id },
      include: {
        supplier: { select: { id: true, businessName: true } },
        createdBy: { select: { email: true } },
        receivedBy: { select: { email: true } },
        items: { include: { product: { select: { id: true, name: true, slug: true, price: true } }, inventoryMovement: true } }
      }
    });
    if (!purchase) return response(404, 'NOT_FOUND');
    return NextResponse.json(purchase);
  } catch (error) { return authError(error) || response(500, 'SERVER_ERROR'); }
}
