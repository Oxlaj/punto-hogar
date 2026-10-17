import { NextResponse } from 'next/server';
import { prisma } from '../../../../../../src/lib/prisma';
import { requireAdministrator, requirePermission, invalidatePermissions } from '../../../../../../src/lib/permissions';
import { logAudit } from '../../../../../../src/lib/audit';

export const runtime = 'nodejs';
function err(status: number, code: string, message?: string) { return NextResponse.json({ error: message || code, code }, { status }); }

interface Params { params: { id: string } }

// POST { userId } to assign role to user
// DELETE { userId } to remove role from user

export async function POST(req: Request, { params }: Params) {
  try {
    await requireAdministrator();
    await requirePermission('role:update');
    const body = await req.json();
    let userId = String(body.userId||'');
    const email = typeof body.email === 'string' ? body.email.trim() : '';
    if (!userId && email) {
      const u = await prisma.user.findUnique({ where: { email } });
      if (!u) return err(404,'USER_NOT_FOUND');
      userId = u.id;
    }
    if (!userId) return err(400,'USER_REQUIRED');
    const role = await prisma.roleEntity.findFirst({ where: { OR: [ { id: params.id }, { name: params.id } ] } });
    if (!role) return err(404,'NOT_FOUND');
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId, roleId: role.id } },
      update: {},
      create: { userId, roleId: role.id }
    });
    invalidatePermissions(userId);
    logAudit('role.assign','Role', role.id, { userId });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    if (e instanceof Error) {
      if (e.message === 'UNAUTHENTICATED') return err(401,'UNAUTHENTICATED');
      if (e.message === 'FORBIDDEN') return err(403,'FORBIDDEN');
    }
    return err(500,'SERVER_ERROR');
  }
}

export async function DELETE(req: Request, { params }: Params) {
  try {
    const administrator = await requireAdministrator();
    await requirePermission('role:update');
    const body = await req.json().catch(()=>({}));
    const userId = String(body.userId||'');
    if (!userId) return err(400,'USER_REQUIRED');
    const role = await prisma.roleEntity.findUnique({ where: { id: params.id } });
    if (!role) return err(404,'NOT_FOUND');
    if (administrator.id === userId && ['admin', 'ADMIN', 'Administrador'].includes(role.name)) {
      return err(409, 'SELF_ADMIN_REVOKE', 'No puedes quitarte tu propio acceso administrativo.');
    }
    if (['admin', 'ADMIN', 'Administrador'].includes(role.name)) {
      const assignments = await prisma.userRole.count({ where: { roleId: role.id } });
      if (assignments <= 1) {
        return err(409, 'LAST_ADMIN_REVOKE', 'No puedes revocar el último acceso administrativo del sistema.');
      }
    }
    await prisma.userRole.deleteMany({ where: { userId, roleId: role.id } });
    invalidatePermissions(userId);
    logAudit('role.revoke','Role', role.id, { userId });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    if (e instanceof Error) {
      if (e.message === 'UNAUTHENTICATED') return err(401,'UNAUTHENTICATED');
      if (e.message === 'FORBIDDEN') return err(403,'FORBIDDEN');
    }
    return err(500,'SERVER_ERROR');
  }
}
