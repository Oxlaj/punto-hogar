import { prisma } from '../src/lib/prisma';

const PERMISSIONS = [
  'admin:access',
  'dashboard:access',
  'product:read','product:create','product:update','product:delete',
  'category:read','category:create','category:update','category:delete',
  'order:read','order:manageStatus',
  'user:read','user:create','user:update','user:delete',
  'role:read','role:update'
];

const ROLES: Record<string,string[]> = {
  admin: PERMISSIONS,
  manager: [
    'admin:access','dashboard:access',
    'product:read','product:create','product:update','product:delete',
    'category:read','category:create','category:update','category:delete',
    'order:read','order:manageStatus'
  ],
  support: ['product:read','category:read','order:read'],
  viewer: ['product:read','category:read']
};

async function main() {
  // Upsert permissions
  const permMap: Record<string,string> = {};
  for (const key of PERMISSIONS) {
    const p = await prisma.permission.upsert({
      where: { key },
      update: {},
      create: { key }
    });
    permMap[key] = p.id;
  }

  // Upsert roles
  for (const [name, perms] of Object.entries(ROLES)) {
    const r = await prisma.roleEntity.upsert({
      where: { name },
      update: {},
      create: { name, label: name.toUpperCase() }
    });
    // reset role permissions
    await prisma.rolePermission.deleteMany({ where: { roleId: r.id } });
    if (perms.length) {
      await prisma.rolePermission.createMany({
        data: perms.map(k => ({ roleId: r.id, permissionId: permMap[k] }))
      });
    }
  }

  // Map legacy enum ADMIN users to admin role
  const adminRole = await prisma.roleEntity.findUnique({ where: { name: 'admin' } });
  if (adminRole) {
    const legacyAdmins = await prisma.user.findMany({ where: { role: 'ADMIN' } });
    for (const u of legacyAdmins) {
      await prisma.userRole.upsert({
        where: { userId_roleId: { userId: u.id, roleId: adminRole.id } },
        update: {},
        create: { userId: u.id, roleId: adminRole.id }
      });
    }
  }

  console.log('RBAC seed completed');
}

main().catch(e=>{ console.error(e); process.exit(1); }).finally(()=>prisma.$disconnect());
