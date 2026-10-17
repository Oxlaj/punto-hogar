import { NextResponse } from 'next/server';
import { prisma } from '../../../../../../../src/lib/prisma';
import { requireAdministrator, requirePermission, invalidatePermissions } from '../../../../../../../src/lib/permissions';
import { logAudit } from '../../../../../../../src/lib/audit';

export const runtime = 'nodejs';

interface Params { params: { id: string; userId: string } }

async function findRole(idOrName: string) {
  return prisma.roleEntity.findFirst({ where: { OR: [ { id: idOrName }, { name: idOrName } ] } });
}

export async function DELETE(_: Request, { params }: Params) {
  try {
    const administrator = await requireAdministrator();
    await requirePermission('role:update');
    const role = await findRole(params.id);
    if (!role) return NextResponse.json({ error: 'NOT_FOUND', code: 'NOT_FOUND' }, { status: 404 });
    if (administrator.id === params.userId && ['admin', 'ADMIN', 'Administrador'].includes(role.name)) {
      return NextResponse.json({ error: 'No puedes quitarte tu propio acceso administrativo.', code: 'SELF_ADMIN_REVOKE' }, { status: 409 });
    }
    if (['admin', 'ADMIN', 'Administrador'].includes(role.name)) {
      const assignments = await prisma.userRole.count({ where: { roleId: role.id } });
      if (assignments <= 1) {
        return NextResponse.json({ error: 'No puedes revocar el último acceso administrativo del sistema.', code: 'LAST_ADMIN_REVOKE' }, { status: 409 });
      }
    }
    await prisma.userRole.deleteMany({ where: { userId: params.userId, roleId: role.id } });
    invalidatePermissions(params.userId);
    logAudit('role.revoke','Role', role.id, { userId: params.userId });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    if (e instanceof Error) {
      if (e.message === 'UNAUTHENTICATED') return NextResponse.json({ error: 'UNAUTHENTICATED', code: 'UNAUTHENTICATED' }, { status: 401 });
      if (e.message === 'FORBIDDEN') return NextResponse.json({ error: 'FORBIDDEN', code: 'FORBIDDEN' }, { status: 403 });
    }
    return NextResponse.json({ error: 'SERVER_ERROR', code: 'SERVER_ERROR' }, { status: 500 });
  }
}
