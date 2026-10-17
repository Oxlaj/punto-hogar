import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '../../../../src/lib/prisma';
import { requireAdministratorPage } from '../../../../src/lib/guard';
import AdminSupplierForm from '../../../../components/AdminSupplierForm';

export const dynamic = 'force-dynamic';

export default async function SupplierDetailPage({ params }: { params: { id: string } }) {
  const { user, allowed } = await requireAdministratorPage();
  if (!user) return <p className="text-sm text-red-600">No autenticado.</p>;
  if (!allowed) return <p className="text-sm text-red-600">No autorizado.</p>;
  const supplier = await prisma.supplier.findUnique({
    where: { id: params.id },
    include: { productLinks: { where: { isPrimary: true }, include: { product: { include: { category: { select: { name: true } } } } }, orderBy: { product: { name: 'asc' } } } }
  });
  if (!supplier) notFound();
  const initial = {
    id: supplier.id,
    businessName: supplier.businessName,
    nit: supplier.nit || '',
    contactName: supplier.contactName || '',
    phone: supplier.phone || '',
    email: supplier.email || '',
    address: supplier.address || '',
    active: supplier.active,
    notes: supplier.notes || ''
  };
  return <div className="space-y-8">
    <AdminSupplierForm mode="edit" initial={initial} />
    <section className="max-w-3xl space-y-3"><div className="flex items-center justify-between"><h2 className="text-lg font-semibold">Productos asociados</h2><Link href="/admin/suppliers" className="text-sm text-carrot hover:underline">Volver a proveedores</Link></div>
      <div className="overflow-auto bg-white border rounded-xl"><table className="w-full text-sm text-left"><thead className="text-[11px] uppercase bg-neutral-50 text-neutral-500"><tr><th className="px-3 py-2">Producto</th><th className="px-3 py-2">Categoría</th><th className="px-3 py-2">Slug</th></tr></thead><tbody className="divide-y">{supplier.productLinks.map(link => <tr key={link.productId}><td className="px-3 py-2 font-medium">{link.product.name}</td><td className="px-3 py-2">{link.product.category.name}</td><td className="px-3 py-2 text-xs text-neutral-500">{link.product.slug}</td></tr>)}</tbody></table>{supplier.productLinks.length === 0 && <p className="p-6 text-sm text-neutral-500">Sin productos asociados.</p>}</div>
    </section>
  </div>;
}
