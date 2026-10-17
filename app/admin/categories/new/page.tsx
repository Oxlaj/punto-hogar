import AdminCategoryForm from '../../../../components/AdminCategoryForm';
import { requirePagePermission } from '@/lib/guard';

export const dynamic = 'force-dynamic';

export default async function NewCategoryPage() {
  const { user, allowed } = await requirePagePermission(['category:create','category:update']);
  if (!user) return <p className="text-sm text-red-600">No autenticado.</p>;
  if (!allowed) return <p className="text-sm text-red-600">No autorizado.</p>;
  return (
    <div className="max-w-4xl">
      <AdminCategoryForm mode="create" />
    </div>
  );
}
