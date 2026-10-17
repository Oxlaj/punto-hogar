import { prisma } from '@/lib/prisma';
import AdminProductForm from '../../../../components/AdminProductForm';
import { requirePagePermission } from '@/lib/guard.ts';

export const dynamic = 'force-dynamic';

export default async function NewProductPage() {
  const { user, allowed } = await requirePagePermission(['product:create','product:update']);
  if (!user) return <p className="text-sm text-red-600">No autenticado.</p>;
  if (!allowed) return <p className="text-sm text-red-600">No autorizado.</p>;
  const [categories, suppliers] = await Promise.all([
    prisma.category.findMany({ where: { active: true }, orderBy: { name: 'asc' }, select: { id: true, name: true } }),
    prisma.supplier.findMany({ where: { active: true }, orderBy: { businessName: 'asc' }, select: { id: true, businessName: true } })
  ]);
  return (
    <div className="max-w-5xl">
      <AdminProductForm mode="create" categories={categories} suppliers={suppliers} />
    </div>
  );
}
