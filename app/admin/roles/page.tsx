import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth-server';
import { requireAdministratorPage } from '@/lib/guard';
import { listRolesWithAgg } from '@/lib/roles';

export const dynamic = 'force-dynamic';

interface RoleListItem {
  id: string; name: string; label: string; description: string | null; permissions: string[]; users: number;
}

export default async function RolesListPage() {
  const user = await getCurrentUser();
  if (!user) return <p className="text-sm text-red-600">No autenticado.</p>;
  const { perms, allowed } = await requireAdministratorPage();
  const canRead = allowed && (perms.has('admin:access') || perms.has('role:read'));
  const canUpdate = perms.has('admin:access') || perms.has('role:update');
  if (!canRead) return <p className="text-sm text-red-600">No autorizado.</p>;

  // Consultamos directamente la base (más eficiente que hacer fetch interno y evita problemas de URL)
  const roles = await listRolesWithAgg();

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Roles</h1>
          <p className="text-sm text-neutral-600">Gestiona roles y sus permisos.</p>
        </div>
        {canUpdate && (
          <Link href="/admin/roles/new" className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-md bg-carrot text-nav hover:bg-carrot-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-carrot/60">
            <i className='bx bx-plus text-base' /> Nuevo rol
          </Link>
        )}
      </header>

      {roles.length === 0 && <p className="text-sm text-neutral-600">No hay roles.</p>}

      {roles.length > 0 && (
        <div className="overflow-auto border rounded-lg bg-surface">
          <table className="w-full text-sm text-left align-middle min-w-[760px]">
            <thead className="text-[11px] uppercase tracking-wide bg-neutral-50 text-neutral-500">
              <tr>
                <th className="px-3 py-2 font-medium">Nombre</th>
                <th className="px-3 py-2 font-medium">Label</th>
                <th className="px-3 py-2 font-medium">Usuarios</th>
                <th className="px-3 py-2 font-medium"># Permisos</th>
                <th className="px-3 py-2 font-medium">Descripción</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {roles.map(r => (
                <tr key={r.id} className="hover:bg-neutral-50">
                  <td className="px-3 py-2 font-mono text-xs">{r.name}</td>
                  <td className="px-3 py-2 font-medium">{r.label}</td>
                  <td className="px-3 py-2">{r.users}</td>
                  <td className="px-3 py-2">{r.permissions.length}</td>
                  <td className="px-3 py-2 max-w-[260px] truncate text-neutral-600">{r.description}</td>
                  <td className="px-3 py-2 text-right">
                    <Link href={`/admin/roles/${r.id}`} className="text-xs font-medium text-carrot hover:underline">Ver</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
