import Link from 'next/link';
import { prisma } from '../../../src/lib/prisma';
import { requireAdministratorPage } from '../../../src/lib/guard';

export const dynamic = 'force-dynamic';

export default async function AdminSuppliersPage({ searchParams }: { searchParams: { q?: string } }) {
  const { user, allowed } = await requireAdministratorPage();
  if (!user) return <p className="text-sm text-red-600">No autenticado.</p>;
  if (!allowed) return <p className="text-sm text-red-600">No autorizado.</p>;
  const q = (searchParams.q || '').trim();
  const suppliers = await prisma.supplier.findMany({
    where: q ? { OR: [{ businessName: { contains: q, mode: 'insensitive' } }, { nit: { contains: q, mode: 'insensitive' } }] } : undefined,
    include: { _count: { select: { productLinks: true } } },
    orderBy: { businessName: 'asc' }
  });
  return <div className="space-y-8">
    <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div><h1 className="text-2xl font-bold tracking-tight">Proveedores</h1><p className="mt-1 text-sm text-neutral-600">Gestiona proveedores y sus productos asociados.</p></div>
      <Link href="/admin/suppliers/new" className="px-4 py-2 text-sm font-semibold rounded bg-carrot text-nav hover:bg-carrot-dark">Nuevo proveedor</Link>
    </header>
    <form className="flex gap-2" action="/admin/suppliers" method="get">
      <input name="q" defaultValue={q} placeholder="Buscar por nombre o NIT..." className="flex-1 px-4 py-2 text-sm bg-white border rounded-md border-neutral-300" />
      <button className="px-4 py-2 text-sm font-semibold rounded bg-carrot text-nav hover:bg-carrot-dark">Buscar</button>
    </form>
    <div className="overflow-auto bg-white border rounded-lg shadow-sm">
      <table className="w-full text-sm text-left"><thead className="text-[11px] uppercase tracking-wide bg-neutral-50 text-neutral-500"><tr><th className="px-3 py-2">Proveedor</th><th className="px-3 py-2">Estado</th><th className="px-3 py-2">Productos principales</th><th className="px-3 py-2">Tipo</th><th className="px-3 py-2" /></tr></thead>
        <tbody className="divide-y">{suppliers.map(supplier => <tr key={supplier.id} className="hover:bg-neutral-50"><td className="px-3 py-3 font-medium">{supplier.businessName}</td><td className="px-3 py-3"><span className={`px-2 py-1 text-[11px] rounded-full ${supplier.active ? 'bg-green-100 text-green-700' : 'bg-neutral-200 text-neutral-600'}`}>{supplier.active ? 'Activo' : 'Inactivo'}</span></td><td className="px-3 py-3">{supplier._count.productLinks}</td><td className="px-3 py-3 text-xs text-neutral-500">{supplier.isDemo ? 'Demostración' : 'Registrado'}</td><td className="px-3 py-3 text-right"><Link href={`/admin/suppliers/${supplier.id}`} className="text-xs font-medium text-carrot hover:underline">Ver y editar</Link></td></tr>)}</tbody>
      </table>
      {suppliers.length === 0 && <p className="p-8 text-sm text-center text-neutral-500">No se encontraron proveedores.</p>}
    </div>
  </div>;
}
