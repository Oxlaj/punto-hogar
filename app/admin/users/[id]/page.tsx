import { prisma } from '@/lib/prisma';
import AdminUserForm from '../../../../components/AdminUserForm';
import { requireAdministratorPage } from '@/lib/guard';

interface Props { params: { id: string } }
export const dynamic = 'force-dynamic';

export default async function EditUserPage({ params }: Props) {
  const { user, allowed } = await requireAdministratorPage();
  if (!user) return <p className="text-sm text-red-600">No autenticado.</p>;
  if (!allowed) return <p className="text-sm text-red-600">No autorizado.</p>;
  const target = await prisma.user.findUnique({ where: { id: params.id } });
  if (!target) return <p className="text-sm text-neutral-600">Usuario no encontrado.</p>;
  const roleLinks = await prisma.userRole.findMany({ where: { userId: target.id }, select: { roleId: true } });
  const roles = await prisma.roleEntity.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true, label: true } });
  const initial = { ...target } as any;
  return (
    <div className="max-w-3xl">
      <AdminUserForm mode="edit" initial={initial} roles={roles} initialRoleIds={roleLinks.map(r=>r.roleId)} />
    </div>
  );
}
