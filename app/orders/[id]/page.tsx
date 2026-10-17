import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { formatCurrency } from '@/lib/format';

interface Props { params: { id: string } }

export const dynamic = 'force-dynamic';

export default async function OrderDetail({ params }: Props) {
	// @ts-ignore prisma types stale
	const order = await prisma.order.findUnique({
		where: { id: params.id },
		include: { items: true }
	});
	if (!order) return <div className="space-y-4"><h1 className="text-2xl font-bold">Pedido</h1><p className="text-sm">No encontrado.</p></div>;

	return (
		<div className="space-y-8">
			<header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div className="space-y-1">
					<h1 className="text-2xl font-bold tracking-tight">Pedido <span className="font-mono text-base text-neutral-500">#{order.id.slice(0,8)}</span></h1>
					<p className="text-xs text-neutral-500">Creado: {order.createdAt.toISOString().slice(0,16).replace('T',' ')}</p>
				</div>
				<Link href="/account" className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium transition rounded-md bg-carrot text-nav hover:bg-carrot-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-carrot/60">
					<i className='text-base bx bx-home'/> Volver a mis pedidos
				</Link>
			</header>

			{/* Summary first on mobile */}
			<section aria-labelledby="summary-heading" className="grid gap-6 md:grid-cols-3">
				<div className="order-2 space-y-4 md:order-1 md:col-span-2">
					<h2 id="items-heading" className="font-semibold text-neutral-800">Items</h2>
					<ul className="overflow-hidden bg-white border divide-y rounded-md">
						{order.items.map((it: any) => (
							<li key={it.id} className="flex items-center justify-between gap-4 px-4 py-3 text-sm">
								<div className="min-w-0">
									<p className="font-medium leading-tight truncate">{it.name}</p>
									<p className="text-xs text-neutral-500">{it.quantity} × {formatCurrency(Number(it.unitPrice))}</p>
								</div>
								<p className="font-semibold whitespace-nowrap">{formatCurrency(Number(it.unitPrice)*it.quantity)}</p>
							</li>
						))}
					</ul>
				</div>
				<div className="order-1 space-y-4 md:order-2" id="resumen">
					<h2 id="summary-heading" className="font-semibold text-neutral-800">Resumen</h2>
					<div className="p-4 space-y-3 text-sm bg-white border rounded-md">
						<dl className="space-y-2">
							<div className="flex justify-between gap-4"><dt className="text-neutral-500">Cliente</dt><dd className="font-medium text-neutral-800 truncate max-w-[150px] text-right">{order.customer}</dd></div>
							<div className="flex justify-between gap-4"><dt className="text-neutral-500">Email</dt><dd className="truncate max-w-[150px] text-right">{order.email}</dd></div>
							{order.phone && <div className="flex justify-between gap-4"><dt className="text-neutral-500">Teléfono</dt><dd className="truncate max-w-[150px] text-right">{order.phone}</dd></div>}
							{order.address && <div className="flex justify-between gap-4"><dt className="text-neutral-500">Dirección</dt><dd className="truncate max-w-[150px] text-right">{order.address}</dd></div>}
						</dl>
						<hr className="border-neutral-200" />
						<div className="flex justify-between text-neutral-600"><span className="text-neutral-500">Subtotal</span><span>{formatCurrency(Number(order.subtotal))}</span></div>
						<div className="flex justify-between text-base font-semibold"><span className="font-medium text-neutral-600">Total</span><span className="text-carrot-dark">{formatCurrency(Number(order.total))}</span></div>
					</div>
				</div>
			</section>
		</div>
	);
}
