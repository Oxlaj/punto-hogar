import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth-server';
import { requireAdministratorPage } from '@/lib/guard';
import RoleEditForm from './role-form.tsx'; // uses explicit extension
import { getRoleDetail, listAllPermissions } from '@/lib/roles';

interface RoleData { id: string; name: string; label: string; description: string|null; permissions: string[]; users: string[] }

interface Params { params: { id: string } }

export default async function EditRolePage({ params }: Params) {
  const user = await getCurrentUser();
  if (!user) return <p className="text-sm text-red-600">No autenticado.</p>;
  const { perms, allowed } = await requireAdministratorPage();
  const canRead = allowed && (perms.has('admin:access') || perms.has('role:read'));
  if (!canRead) return <p className="text-sm text-red-600">No autorizado.</p>;
  const canUpdate = perms.has('admin:access') || perms.has('role:update');

  const role = await getRoleDetail(params.id);
  if (!role) return <p className="text-sm text-red-600">Rol no encontrado.</p>;
  const allPermissions = await listAllPermissions();

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Editar rol</h1>
          <p className="text-sm text-neutral-600">Gestiona permisos y asignaciones.</p>
        </div>
        <Link href="/admin/roles" className="px-4 py-2 text-sm font-medium transition rounded-md border border-neutral-300 bg-white hover:bg-neutral-50">Volver</Link>
      </header>
  <RoleEditForm role={role} canUpdate={canUpdate} allPermissions={allPermissions} />
    </div>
  );
}
