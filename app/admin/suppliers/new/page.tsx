import AdminSupplierForm from '../../../../components/AdminSupplierForm';
import { requireAdministratorPage } from '../../../../src/lib/guard';

export const dynamic = 'force-dynamic';

export default async function NewSupplierPage() {
  const { user, allowed } = await requireAdministratorPage();
  if (!user) return <p className="text-sm text-red-600">No autenticado.</p>;
  if (!allowed) return <p className="text-sm text-red-600">No autorizado.</p>;
  return <AdminSupplierForm />;
}
