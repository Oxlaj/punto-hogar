import { NextResponse } from 'next/server';
import { prisma } from '../../../../src/lib/prisma';
import { requireAdministrator, requirePermission } from '../../../../src/lib/permissions';
import { logAudit } from '../../../../src/lib/audit';

export const runtime = 'nodejs';
function err(status: number, code: string, message?: string) {
  return NextResponse.json({ error: message || code, code }, { status });
}

// GET /api/admin/roles  (list roles with permissions + user counts)
export async function GET() {
  try {
    await requireAdministrator();
    await requirePermission('role:read');
    const roles = await prisma.roleEntity.findMany({
      orderBy: { name: 'asc' },
      include: {
        rolePerms: { include: { permission: true } },
        userRoles: { select: { userId: true } }
      }
    });
    return NextResponse.json(roles.map(r => ({
      id: r.id,
      name: r.name,
      label: r.label,
      description: r.description,
      permissions: r.rolePerms.map(rp => rp.permission.key),
      users: r.userRoles.length,
      usersCount: r.userRoles.length
    })));
  } catch (e: any) {
    if (e instanceof Error) {
      if (e.message === 'UNAUTHENTICATED') return err(401,'UNAUTHENTICATED');
      if (e.message === 'FORBIDDEN') return err(403,'FORBIDDEN');
    }
    return err(500,'SERVER_ERROR');
  }
}

// POST /api/admin/roles  (create role)
export async function POST(req: Request) {
  try {
    await requireAdministrator();
    await requirePermission('role:update');
    const body = await req.json();
    const name = String(body.name||'').trim();
    const label = String(body.label||'').trim() || name.toUpperCase();
    const description = body.description? String(body.description).trim() : null;
    const permissions: string[] = Array.isArray(body.permissions)? body.permissions.map(String) : [];
    if (!name) return err(400,'NAME_REQUIRED');
    const existing = await prisma.roleEntity.findUnique({ where: { name } });
    if (existing) return err(409,'ROLE_EXISTS');
    const created = await prisma.roleEntity.create({ data: { name, label, description: description || undefined } });
    if (permissions.length) {
      const permRows = await prisma.permission.findMany({ where: { key: { in: permissions } } });
      if (permRows.length) {
        await prisma.rolePermission.createMany({ data: permRows.map(p => ({ roleId: created.id, permissionId: p.id })) });
      }
    }
    logAudit('role.create','Role', created.id, { name, permissions });
    return NextResponse.json({ id: created.id, name, label, description, permissions }, { status: 201 });
  } catch (e: any) {
    if (e instanceof Error) {
      if (e.message === 'UNAUTHENTICATED') return err(401,'UNAUTHENTICATED');
      if (e.message === 'FORBIDDEN') return err(403,'FORBIDDEN');
    }
    return err(500,'SERVER_ERROR');
  }
}
