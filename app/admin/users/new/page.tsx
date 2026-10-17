import { prisma } from '@/lib/prisma';
import AdminUserForm from '../../../../components/AdminUserForm';
import { requireAdministratorPage } from '@/lib/guard';

export const dynamic = 'force-dynamic';

export default async function NewUserPage() {
  const { user, allowed } = await requireAdministratorPage();
  if (!user) return <p className="text-sm text-red-600">No autenticado.</p>;
  if (!allowed) return <p className="text-sm text-red-600">No autorizado.</p>;
  const roles = await prisma.roleEntity.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true, label: true } });
  return (
    <div className="max-w-3xl">
      <AdminUserForm mode="create" roles={roles} initialRoleIds={[]} />
    </div>
  );
}
