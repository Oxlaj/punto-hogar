import { prisma } from './prisma';

export async function listRolesWithAgg() {
  const roles = await prisma.roleEntity.findMany({
    orderBy: { name: 'asc' },
    include: { rolePerms: { include: { permission: true } }, userRoles: { select: { userId: true } } }
  });
  return roles.map(r => ({
    id: r.id,
    name: r.name,
    label: r.label,
    description: r.description,
    permissions: r.rolePerms.map(rp => rp.permission.key),
    users: r.userRoles.length
  }));
}

export async function getRoleDetail(id: string) {
  const r = await prisma.roleEntity.findUnique({
    where: { id },
    include: { rolePerms: { include: { permission: true } }, userRoles: { select: { userId: true } } }
  });
  if (!r) return null;
  return {
    id: r.id,
    name: r.name,
    label: r.label,
    description: r.description,
    permissions: r.rolePerms.map(rp => rp.permission.key),
    users: r.userRoles.map(u => u.userId)
  };
}

export async function listAllPermissions() {
  const rows = await prisma.permission.findMany({ orderBy: { key: 'asc' } });
  return rows.map(p => ({ key: p.key, description: p.description }));
}
