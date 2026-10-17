import '../../globals.css';
import { AdminSidebar } from '../../components/AdminSidebar';
import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth-server';
import { getUserPermissions } from '@/lib/permissions';
import Image from 'next/image';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
	const user = await getCurrentUser();
	if (!user) return <p className="p-6 text-sm text-red-600">No autenticado.</p>;
	const perms = await getUserPermissions(user.id);
	if (!(perms.has('admin:access') || perms.has('dashboard:access'))) {
		return <p className="p-6 text-sm text-red-600">No autorizado.</p>;
	}
	return (
		<div className="flex min-h-screen bg-surface-alt">
			<div className="flex flex-col flex-1 min-w-0 md:pl-64">
				<header className="sticky top-0 z-30 flex items-center px-6 border-b h-14 bg-white/80 backdrop-blur">
					<div className="flex items-center justify-between w-full">
						<div className="flex items-center gap-3 text-sm">
							<Link href="/" className="flex items-center">
								<Image src="/logo-punto-hogar.png" alt="Punto Hogar" width={132} height={38} className="object-contain w-auto h-8" />
							</Link>
							<span className="hidden text-[11px] px-2 py-0.5 rounded-full bg-carrot text-nav font-semibold md:inline-block">Admin</span>
						</div>
						<div className="flex items-center gap-2 text-[11px] text-neutral-500">
							<span>Panel interno</span>
						</div>
					</div>
				</header>
				<main className="w-full p-6 mx-auto space-y-10 max-w-7xl">{children}</main>
			</div>
			<AdminSidebar />
		</div>
	);
}
