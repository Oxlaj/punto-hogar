import { NextResponse } from 'next/server';
import { prisma } from '../../../../src/lib/prisma';
import { requireAdministrator } from '../../../../src/lib/permissions';
import { logAudit } from '../../../../src/lib/audit';
import { z } from 'zod';

const supplierSchema = z.object({
  businessName: z.string().trim().min(1).max(160),
  nit: z.string().trim().max(40).optional().nullable(),
  contactName: z.string().trim().max(120).optional().nullable(),
  phone: z.string().trim().max(50).optional().nullable(),
  email: z.string().trim().email().max(160).optional().nullable().or(z.literal('')),
  address: z.string().trim().max(240).optional().nullable(),
  active: z.boolean().default(true),
  notes: z.string().trim().max(500).optional().nullable()
});

function errorResponse(status: number, code: string, message = code) {
  return NextResponse.json({ error: message, code }, { status });
}

function authError(error: unknown) {
  if (error instanceof Error && error.message === 'UNAUTHENTICATED') return errorResponse(401, 'UNAUTHENTICATED');
  if (error instanceof Error && error.message === 'FORBIDDEN') return errorResponse(403, 'FORBIDDEN');
  return null;
}

export async function GET(request: Request) {
  try {
    await requireAdministrator();
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q')?.trim() || '';
    const suppliers = await prisma.supplier.findMany({
      where: q ? { OR: [{ businessName: { contains: q, mode: 'insensitive' } }, { nit: { contains: q, mode: 'insensitive' } }] } : undefined,
      include: {
        _count: { select: { productLinks: true, purchases: true } },
        productLinks: { where: { isPrimary: true }, select: { product: { select: { id: true, name: true, slug: true } } }, orderBy: { product: { name: 'asc' } } }
      },
      orderBy: { businessName: 'asc' }
    });
    return NextResponse.json(suppliers);
  } catch (error) {
    return authError(error) || errorResponse(500, 'SERVER_ERROR');
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAdministrator();
    const parsed = supplierSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return errorResponse(400, 'INVALID_SUPPLIER', parsed.error.issues[0]?.message || 'Datos inválidos');
    const data = parsed.data;
    const supplier = await prisma.supplier.create({
      data: {
        ...data,
        nit: data.nit || null,
        contactName: data.contactName || null,
        phone: data.phone || null,
        email: data.email || null,
        address: data.address || null,
        notes: data.notes || null
      }
    });
    await logAudit('supplier.create', 'Supplier', supplier.id, { businessName: supplier.businessName, userId: user.id });
    return NextResponse.json(supplier, { status: 201 });
  } catch (error: any) {
    const auth = authError(error);
    if (auth) return auth;
    if (error?.code === 'P2002') return errorResponse(409, 'SUPPLIER_EXISTS', 'Ya existe un proveedor con ese nombre.');
    return errorResponse(500, 'SERVER_ERROR');
  }
}
