import { NextResponse } from 'next/server';
import { prisma } from '../../../../../../src/lib/prisma';
import { requireAdministrator, requirePermission } from '../../../../../../src/lib/permissions';

export const runtime = 'nodejs';

interface Params { params: { id: string } }

async function findRole(idOrName: string) {
  return prisma.roleEntity.findFirst({ where: { OR: [ { id: idOrName }, { name: idOrName } ] } });
}

export async function GET(_: Request, { params }: Params) {
  try {
    await requireAdministrator();
    await requirePermission('role:read');
    const role = await findRole(params.id);
    if (!role) return NextResponse.json({ error: 'NOT_FOUND', code: 'NOT_FOUND' }, { status: 404 });
    const users = await prisma.user.findMany({
      where: { userRoles: { some: { roleId: role.id } } },
      orderBy: { createdAt: 'desc' }
    });
    // return consistent mobile-friendly shape
    const items = users.map(u => ({ id: u.id, email: u.email, name: u.name || null, roles: [], createdAt: u.createdAt }));
    return NextResponse.json({ items });
  } catch (e: any) {
    if (e instanceof Error) {
      if (e.message === 'UNAUTHENTICATED') return NextResponse.json({ error: 'UNAUTHENTICATED', code: 'UNAUTHENTICATED' }, { status: 401 });
      if (e.message === 'FORBIDDEN') return NextResponse.json({ error: 'FORBIDDEN', code: 'FORBIDDEN' }, { status: 403 });
    }
    return NextResponse.json({ error: 'SERVER_ERROR', code: 'SERVER_ERROR' }, { status: 500 });
  }
}
