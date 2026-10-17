import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth-server';
import { requireAdministratorPage } from '@/lib/guard';
import NewRoleForm from './role-form.tsx';
import { listAllPermissions } from '@/lib/roles';

export default async function NewRolePage() {
  const user = await getCurrentUser();
  if (!user) return <p className="text-sm text-red-600">No autenticado.</p>;
  const { perms, allowed } = await requireAdministratorPage();
  const canUpdate = allowed && (perms.has('admin:access') || perms.has('role:update'));
  if (!canUpdate) return <p className="text-sm text-red-600">No autorizado.</p>;

  const permissions = await listAllPermissions();

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Nuevo Rol</h1>
          <p className="text-sm text-neutral-600">Define permisos iniciales para el rol.</p>
        </div>
        <Link href="/admin/roles" className="px-4 py-2 text-sm font-medium transition rounded-md border border-neutral-300 bg-white hover:bg-neutral-50">Volver</Link>
      </header>
  <NewRoleForm permissions={permissions} />
    </div>
  );
}
