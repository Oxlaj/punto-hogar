import { prisma } from '../../../../src/lib/prisma';
import { requireAdministratorPage } from '../../../../src/lib/guard';
import AdminPurchaseForm from '../../../../components/AdminPurchaseForm';

export const dynamic = 'force-dynamic';

export default async function NewPurchasePage() {
  const { user, allowed } = await requireAdministratorPage();
  if (!user) return <p className="text-sm text-red-600">No autenticado.</p>;
  if (!allowed) return <p className="text-sm text-red-600">No autorizado.</p>;
  const suppliers = await prisma.supplier.findMany({
    where: { active: true },
    orderBy: { businessName: 'asc' },
    select: { id: true, businessName: true, productLinks: { include: { product: { select: { id: true, name: true, price: true, active: true, category: { select: { name: true } } } } } } }
  });
  const options = suppliers.map(supplier => ({
    id: supplier.id,
    businessName: supplier.businessName,
    products: supplier.productLinks.filter(link => link.product.active).map(link => ({ id: link.product.id, name: link.product.name, price: link.product.price.toString(), category: link.product.category.name }))
  }));
  return <AdminPurchaseForm suppliers={options} />;
}
