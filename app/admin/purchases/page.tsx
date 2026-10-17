import Link from 'next/link';
import { prisma } from '../../../src/lib/prisma';
import { requireAdministratorPage } from '../../../src/lib/guard';
import { formatCurrency } from '../../../src/lib/format';

export const dynamic = 'force-dynamic';

export default async function AdminPurchasesPage({ searchParams }: { searchParams: { q?: string; status?: string } }) {
  const { user, allowed } = await requireAdministratorPage();
  if (!user) return <p className="text-sm text-red-600">No autenticado.</p>;
  if (!allowed) return <p className="text-sm text-red-600">No autorizado.</p>;
  const q = (searchParams.q || '').trim();
  const status = searchParams.status === 'RECEIVED' ? 'RECEIVED' : searchParams.status === 'PENDING' ? 'PENDING' : undefined;
  const purchases = await prisma.purchase.findMany({
    where: { ...(status ? { status } : {}), ...(q ? { OR: [{ id: { contains: q } }, { invoiceReference: { contains: q, mode: 'insensitive' } }, { supplier: { businessName: { contains: q, mode: 'insensitive' } } }] } : {}) },
    include: { supplier: { select: { businessName: true } }, _count: { select: { items: true } } },
    orderBy: { purchaseDate: 'desc' }
  });
  return <div className="space-y-8">
    <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><h1 className="text-2xl font-bold">Compras</h1><p className="mt-1 text-sm text-neutral-600">Registra compras y confirma su recepción para ingresar existencias.</p></div><Link href="/admin/purchases/new" className="px-4 py-2 text-sm font-semibold rounded bg-carrot text-nav hover:bg-carrot-dark">Nueva compra</Link></header>
    <form className="flex flex-col gap-2 sm:flex-row" method="get"><input name="q" defaultValue={q} placeholder="Buscar proveedor, factura o ID..." className="flex-1 px-4 py-2 text-sm bg-white border rounded-md border-neutral-300" /><select name="status" defaultValue={status || ''} className="px-3 py-2 text-sm bg-white border rounded-md border-neutral-300"><option value="">Todos los estados</option><option value="PENDING">Pendientes</option><option value="RECEIVED">Recibidas</option></select><button className="px-4 py-2 text-sm font-semibold rounded bg-carrot text-nav">Buscar</button></form>
    <div className="overflow-auto bg-white border rounded-lg shadow-sm"><table className="w-full text-sm text-left"><thead className="text-[11px] uppercase tracking-wide bg-neutral-50 text-neutral-500"><tr><th className="px-3 py-2">Proveedor</th><th className="px-3 py-2">Fecha</th><th className="px-3 py-2">Factura</th><th className="px-3 py-2">Productos</th><th className="px-3 py-2">Total</th><th className="px-3 py-2">Estado</th><th className="px-3 py-2" /></tr></thead><tbody className="divide-y">{purchases.map(purchase => <tr key={purchase.id} className="hover:bg-neutral-50"><td className="px-3 py-3 font-medium">{purchase.supplier.businessName}</td><td className="px-3 py-3 whitespace-nowrap">{purchase.purchaseDate.toISOString().slice(0, 10)}</td><td className="px-3 py-3 text-neutral-600">{purchase.invoiceReference || '—'}</td><td className="px-3 py-3">{purchase._count.items}</td><td className="px-3 py-3 font-semibold">{formatCurrency(Number(purchase.total))}</td><td className="px-3 py-3"><span className={`px-2 py-1 text-[11px] rounded-full ${purchase.status === 'RECEIVED' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>{purchase.status === 'RECEIVED' ? 'Recibida' : 'Pendiente'}</span></td><td className="px-3 py-3 text-right"><Link href={`/admin/purchases/${purchase.id}`} className="text-xs font-medium text-carrot hover:underline">Ver</Link></td></tr>)}</tbody></table>{!purchases.length && <p className="p-8 text-sm text-center text-neutral-500">No hay compras registradas.</p>}</div>
  </div>;
}
