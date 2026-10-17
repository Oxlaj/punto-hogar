import { redirect } from 'next/navigation';
import { getSession } from '../../src/lib/auth';
import LogoutButton from './logout-button';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function AccountPage() {
	const session = await getSession();
	if (!session) redirect('/login');

	return (
		<div className="max-w-6xl py-10 mx-auto space-y-10">
			<Header email={session.email} role={session.role} />
			<div className="grid gap-6 lg:grid-cols-3">
				<div className="space-y-6 lg:col-span-2">
					<section className="space-y-4">
						<SectionHeader title="Acciones" />
						<div className="p-6 border rounded-lg shadow-sm bg-surface">
							<div className="flex flex-wrap items-center gap-3">
								<Link href="/account/orders" className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded bg-carrot text-nav hover:bg-carrot-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nav">
									<i className='text-base bx bx-receipt'/> Mis pedidos
								</Link>
								<Link href="/contact" className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium border rounded border-neutral-300 hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-carrot/60">
									<i className='text-base bx bx-help-circle'/> Soporte
								</Link>
							</div>
						</div>
					</section>
				</div>
				<aside className="space-y-6 lg:sticky lg:top-24 h-max">
					<ProfileCard email={session.email} role={session.role} />
					<HelpCard />
				</aside>
			</div>
		</div>
	);
}

function Header({ email, role }: { email: string; role: string }) {
	return (
		<header className="space-y-2">
			<h1 className="text-3xl font-bold tracking-tight">Mi cuenta</h1>
			<p className="text-sm text-neutral-600">Sesión iniciada como <strong>{email}</strong> (rol {role}).</p>
		</header>
	);
}

function ProfileCard({ email, role }: { email: string; role: string }) {
	return (
		<div className="p-5 space-y-4 border rounded-lg shadow-sm bg-surface">
			<div className="flex items-center gap-3">
				<div className="flex items-center justify-center w-12 h-12 text-lg font-semibold rounded-full bg-nav text-carrot">
					{email.charAt(0).toUpperCase()}
				</div>
				<div>
					<p className="text-sm font-medium text-neutral-800">{email}</p>
					<p className="text-xs tracking-wide uppercase text-neutral-500">{role}</p>
				</div>
			</div>
			<LogoutButton />
			<div className="pt-2 border-t">
				<ul className="text-[11px] space-y-1 text-neutral-600">
					<li><span className="font-medium text-neutral-700">Privacidad:</span> Nunca compartimos tu correo.</li>
					<li><span className="font-medium text-neutral-700">Soporte:</span> <Link href="/contact" className="text-carrot hover:underline">Contacto</Link></li>
				</ul>
			</div>
		</div>
	);
}


// Se removieron las métricas y el listado inline de pedidos para simplificar la vista de cuenta.

function SectionHeader({ title, count }: { title: string; count?: number }) {
	return (
		<div className="flex items-center justify-between">
			<h2 className="text-lg font-semibold text-nav">{title}</h2>
			{typeof count === 'number' && <span className="text-[11px] px-2 py-0.5 rounded-full bg-nav text-surface">{count}</span>}
		</div>
	);
}

function HelpCard() {
	return (
		<div className="p-5 space-y-4 border rounded-lg bg-surface shadow-sm text-[13px] text-neutral-600">
			<p className="font-semibold text-neutral-800">¿Necesitas ayuda?</p>
			<p className="leading-relaxed">Visita la sección de contacto para soporte o preguntas sobre tus pedidos recientes.</p>
			<Link href="/contact" className="inline-block px-4 py-2 text-xs font-semibold rounded bg-carrot text-nav hover:bg-carrot-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nav">Contacto</Link>
		</div>
	);
}
