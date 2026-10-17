import { NextResponse } from 'next/server';
import { prisma } from '../../../../../src/lib/prisma';
import { requireAdministrator, requirePermission, invalidatePermissions } from '../../../../../src/lib/permissions';
import { logAudit } from '../../../../../src/lib/audit';

export const runtime = 'nodejs';
function err(status: number, code: string, message?: string) { return NextResponse.json({ error: message || code, code }, { status }); }

interface Params { params: { id: string } }

async function findRoleByIdOrName(idOrName: string) {
  return prisma.roleEntity.findFirst({
    where: { OR: [ { id: idOrName }, { name: idOrName } ] },
    include: { rolePerms: { include: { permission: true } }, userRoles: { select: { userId: true } } }
  });
}

export async function GET(_: Request, { params }: Params) {
  try {
    await requireAdministrator();
    await requirePermission('role:read');
    const role = await findRoleByIdOrName(params.id);
    if (!role) return err(404,'NOT_FOUND');
    return NextResponse.json({
      id: role.id,
      name: role.name,
      label: role.label,
      description: role.description,
      permissions: role.rolePerms.map(rp => rp.permission.key),
      users: role.userRoles.map(u => u.userId)
    });
  } catch (e: any) {
    if (e instanceof Error) {
      if (e.message === 'UNAUTHENTICATED') return err(401,'UNAUTHENTICATED');
      if (e.message === 'FORBIDDEN') return err(403,'FORBIDDEN');
    }
    return err(500,'SERVER_ERROR');
  }
}

export async function PUT(req: Request, { params }: Params) {
  try {
    await requireAdministrator();
    await requirePermission('role:update');
    const body = await req.json();
    const label = body.label ? String(body.label).trim() : undefined;
    const description = body.description === null ? null : (body.description ? String(body.description).trim() : undefined);
    const permissions: string[] | undefined = Array.isArray(body.permissions) ? body.permissions.map(String) : undefined;

  const existing = await prisma.roleEntity.findFirst({ where: { OR: [ { id: params.id }, { name: params.id } ] } });
    if (!existing) return err(404,'NOT_FOUND');

  const updated = await prisma.roleEntity.update({ where: { id: existing.id }, data: { label, description } });

    if (permissions) {
      // reset
  await prisma.rolePermission.deleteMany({ where: { roleId: updated.id } });
      if (permissions.length) {
        const permRows = await prisma.permission.findMany({ where: { key: { in: permissions } } });
        if (permRows.length) {
          await prisma.rolePermission.createMany({ data: permRows.map(p => ({ roleId: updated.id, permissionId: p.id })) });
        }
      }
    }
  logAudit('role.update','Role', updated.id, { permissions });
  // Invalida cache de permisos para todos (simplificación)
  invalidatePermissions();
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    if (e instanceof Error) {
      if (e.message === 'UNAUTHENTICATED') return err(401,'UNAUTHENTICATED');
      if (e.message === 'FORBIDDEN') return err(403,'FORBIDDEN');
    }
    return err(500,'SERVER_ERROR');
  }
}

export async function DELETE(_: Request, { params }: Params) {
  try {
    await requireAdministrator();
    await requirePermission('role:update');
  const existing = await prisma.roleEntity.findFirst({ where: { OR: [ { id: params.id }, { name: params.id } ] } });
    if (!existing) return err(404,'NOT_FOUND');
  if (['admin', 'ADMIN', 'Administrador'].includes(existing.name)) {
    return err(409, 'ADMIN_ROLE_DELETE', 'No se puede eliminar el rol administrativo del sistema.');
  }
  await prisma.rolePermission.deleteMany({ where: { roleId: existing.id } });
    await prisma.userRole.deleteMany({ where: { roleId: existing.id } });
    await prisma.roleEntity.delete({ where: { id: existing.id } });
  logAudit('role.delete','Role', params.id);
  invalidatePermissions();
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    if (e instanceof Error) {
      if (e.message === 'UNAUTHENTICATED') return err(401,'UNAUTHENTICATED');
      if (e.message === 'FORBIDDEN') return err(403,'FORBIDDEN');
    }
    return err(500,'SERVER_ERROR');
  }
}
