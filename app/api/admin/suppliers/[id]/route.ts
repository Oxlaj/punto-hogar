import { NextResponse } from 'next/server';
import { prisma } from '../../../../../src/lib/prisma';
import { requireAdministrator } from '../../../../../src/lib/permissions';
import { logAudit } from '../../../../../src/lib/audit';
import { z } from 'zod';

const schema = z.object({
  businessName: z.string().trim().min(1).max(160),
  nit: z.string().trim().max(40).optional().nullable(),
  contactName: z.string().trim().max(120).optional().nullable(),
  phone: z.string().trim().max(50).optional().nullable(),
  email: z.string().trim().email().max(160).optional().nullable().or(z.literal('')),
  address: z.string().trim().max(240).optional().nullable(),
  active: z.boolean(),
  notes: z.string().trim().max(500).optional().nullable()
});

function response(status: number, code: string, error = code) { return NextResponse.json({ error, code }, { status }); }
function authError(error: unknown) {
  if (error instanceof Error && error.message === 'UNAUTHENTICATED') return response(401, 'UNAUTHENTICATED');
  if (error instanceof Error && error.message === 'FORBIDDEN') return response(403, 'FORBIDDEN');
  return null;
}

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    await requireAdministrator();
    const supplier = await prisma.supplier.findUnique({
      where: { id: params.id },
      include: {
        productLinks: { where: { isPrimary: true }, include: { product: { include: { category: { select: { name: true } } } } }, orderBy: { product: { name: 'asc' } } },
        _count: { select: { purchases: true } }
      }
    });
    if (!supplier) return response(404, 'NOT_FOUND');
    return NextResponse.json(supplier);
  } catch (error) { return authError(error) || response(500, 'SERVER_ERROR'); }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireAdministrator();
    const parsed = schema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return response(400, 'INVALID_SUPPLIER', parsed.error.issues[0]?.message || 'Datos inválidos');
    const data = parsed.data;
    const supplier = await prisma.supplier.update({
      where: { id: params.id },
      data: { ...data, nit: data.nit || null, contactName: data.contactName || null, phone: data.phone || null, email: data.email || null, address: data.address || null, notes: data.notes || null }
    });
    await logAudit('supplier.update', 'Supplier', supplier.id, { businessName: supplier.businessName, userId: user.id });
    return NextResponse.json(supplier);
  } catch (error: any) {
    const auth = authError(error);
    if (auth) return auth;
    if (error?.code === 'P2025') return response(404, 'NOT_FOUND');
    if (error?.code === 'P2002') return response(409, 'SUPPLIER_EXISTS', 'Ya existe un proveedor con ese nombre.');
    return response(500, 'SERVER_ERROR');
  }
}
