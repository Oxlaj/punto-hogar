"use client";
import { useEffect, useState } from 'react';
import { getCart, updateItem, removeItem, CartItem, EnrichedCartItem } from '../../src/lib/cart';
import { formatCurrency } from '../../src/lib/format';
import { showToast } from 'nextjs-toast-notify';

interface Row extends CartItem { name?: string; price?: number; lineTotal?: number; slug?: string; imageUrl?: string | null }

export default function CartPage() {
		const [items, setItems] = useState<Row[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [updating, setUpdating] = useState<string | null>(null);
		const [optimistic, setOptimistic] = useState<Row[]>([]); // para UI optimista
		const [emptying, setEmptying] = useState(false);
		const isOptimistic = optimistic.length > 0;

		// Debounce cache para cambios de cantidad
		const pendingTimers = new Map<string, any>();

	async function load() {
		try {
			setLoading(true);
			const cart = await getCart();
			if ((cart as any).enriched) {
				const enriched = (cart as any).enriched as EnrichedCartItem[];
				setItems(enriched.map(e => ({ ...e })));
			} else {
				setItems(cart.items.map(i => ({ ...i, name: i.productId })));
			}
		} catch (e: any) { setError(e.message); } finally { setLoading(false); }
	}

	useEffect(() => { load(); }, []);

		function applyOptimistic(productId: string, qty: number) {
			setOptimistic(prev => {
				const base = prev.length ? [...prev] : [...items];
				const idx = base.findIndex(i => i.productId === productId);
				if (idx !== -1) {
					if (qty <= 0) base.splice(idx, 1); else base[idx] = { ...base[idx], qty, lineTotal: (base[idx].price || 0) * qty };
				}
				return base;
			});
		}

		async function commitQty(productId: string, qty: number) {
			try {
				setUpdating(productId);
				await updateItem(productId, qty);
				await load();
			} catch (e: any) {
				setError(e.message); showToast.error(e?.message || 'Error', { duration: 2500, position: 'top-right' });
			} finally { setUpdating(null); setOptimistic([]); }
		}

		function changeQty(productId: string, qty: number) {
			if (qty < 0) qty = 0;
			applyOptimistic(productId, qty);
			if (pendingTimers.has(productId)) clearTimeout(pendingTimers.get(productId));
			const t = setTimeout(() => commitQty(productId, qty), 500);
			pendingTimers.set(productId, t);
		}

		async function remove(productId: string) {
			try {
				setUpdating(productId);
				// optimista
				setOptimistic(prev => prev.length ? prev.filter(i => i.productId !== productId) : items.filter(i => i.productId !== productId));
				await removeItem(productId);
				showToast.success('Eliminado del carrito', { duration: 1600, position: 'top-right' });
				await load();
			} catch (e: any) { setError(e.message); showToast.error(e?.message || 'Error', { duration: 2500, position: 'top-right' }); }
			finally { setUpdating(null); setOptimistic([]); }
		}

		async function emptyCart() {
			if (!items.length) return;
			try {
				setEmptying(true);
				// Eliminar cada item (simple; se podría hacer un endpoint dedicado)
				for (const it of items) {
					await removeItem(it.productId);
				}
				showToast.success('Carrito vaciado', { duration: 1800, position: 'top-right' });
				await load();
			} catch (e: any) { setError(e.message); showToast.error(e?.message || 'Error', { duration: 2500, position: 'top-right' }); }
			finally { setEmptying(false); }
		}

		const effective = isOptimistic ? optimistic : items;
		const totalQty = effective.reduce((sum, i) => sum + i.qty, 0);
		const subtotal = effective.reduce((s, i) => s + (i.lineTotal || 0), 0);
		const taxRate = 0.12; // ejemplo IVA 12%
		const taxes = subtotal * taxRate;
		const total = subtotal + taxes;

		const Skeleton = () => (
			<li className="flex gap-4 p-4 bg-white border shadow-sm animate-ping rounded-xl">
				<div className="w-20 h-20 rounded-md bg-neutral-200" />
				<div className="flex-1 space-y-3">
					<div className="w-2/3 h-4 rounded bg-neutral-200" />
					<div className="w-1/3 h-3 rounded bg-neutral-200" />
					<div className="w-40 h-6 rounded bg-neutral-200" />
				</div>
			</li>
		);

	return (
		<div className="max-w-6xl px-4 mx-auto space-y-10 md:py-6">
			<header className="space-y-2">
				<h1 className="text-2xl font-bold tracking-tight md:text-3xl">Tu carrito</h1>
				<p className="text-sm text-neutral-600">Revisa y ajusta los productos antes de proceder al pago.</p>
			</header>

			{error && <p className="text-sm text-red-600">{error}</p>}
					{loading && (
						<ul className="space-y-4">{Array.from({length:3}).map((_,i)=><Skeleton key={i} />)}</ul>
					)}
			{!loading && items.length === 0 && (
				<div className="p-10 text-center bg-white border shadow-sm rounded-xl">
					<p className="mb-4 text-sm text-neutral-600">Tu carrito está vacío.</p>
					<a href="/products" className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-full bg-carrot text-nav hover:bg-carrot-dark transition focus:outline-none focus-visible:ring-2 focus-visible:ring-carrot/60">Explorar productos <i className='text-base bx bx-right-arrow-alt' /></a>
				</div>
			)}

					{!loading && effective.length > 0 && (
				<div className="grid gap-10 md:grid-cols-[1fr_340px] items-start">
					{/* Items list */}
					<div className="space-y-4">
						<ul className="space-y-4">
									{effective.map(i => (
										<li key={i.productId} className={`relative flex gap-4 p-4 bg-white border rounded-xl shadow-sm transition ${updating===i.productId?'opacity-60':''}`}>
											<div className="flex-shrink-0 w-20 h-20 overflow-hidden rounded-md bg-neutral-100">
												{i.imageUrl ? (
													/* eslint-disable-next-line @next/next/no-img-element */
													<img src={i.imageUrl} alt={i.name||'Producto'} className="object-cover w-full h-full" />
												) : (
													<div className="w-full h-full flex items-center justify-center text-[10px] text-neutral-400">SIN IMAGEN</div>
												)}
											</div>
											<div className="flex-1 min-w-0">
												<div className="flex items-start justify-between gap-4">
													<div className="min-w-0 space-y-1">
														<a href={`/products/${i.slug || i.productId}`} className="text-sm font-semibold text-neutral-900 hover:text-carrot line-clamp-2">{i.name}</a>
														<div className="text-[11px] text-neutral-500">Unidad: {i.price != null ? formatCurrency(i.price) : '-'}</div>
													</div>
													<button onClick={() => remove(i.productId)} disabled={updating === i.productId} className="text-[11px] font-medium text-red-600 hover:text-red-700 disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/50 rounded">{updating === i.productId ? '...' : 'Eliminar'}</button>
												</div>
												<div className="flex flex-wrap items-center gap-4 mt-4">
													<div className="flex items-center overflow-hidden border rounded-full border-neutral-300 bg-neutral-50 h-9">
														<button onClick={() => changeQty(i.productId, i.qty - 1)} disabled={updating === i.productId} className="h-full px-4 text-neutral-600 hover:bg-neutral-200 disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-carrot/60">-</button>
														<input
															type="number"
															min={0}
															className="h-full text-sm text-center bg-transparent w-14 focus:outline-none"
															value={i.qty}
															onChange={e => changeQty(i.productId, parseInt(e.target.value || '0', 10))}
														/>
														<button onClick={() => changeQty(i.productId, i.qty + 1)} disabled={updating === i.productId} className="h-full px-4 text-neutral-600 hover:bg-neutral-200 disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-carrot/60">+</button>
													</div>
													<div className="ml-auto text-sm font-semibold text-right text-neutral-900">
														{i.lineTotal != null ? formatCurrency(i.lineTotal) : '-'}
													</div>
												</div>
											</div>
										</li>
									))}
						</ul>
					</div>

					{/* Summary */}
								<aside className="sticky p-5 space-y-6 bg-white border shadow-sm rounded-xl h-fit top-24">
						<h2 className="text-sm font-semibold tracking-wide text-neutral-700">Resumen</h2>
						<div className="space-y-3 text-sm">
							<div className="flex justify-between"><span>Artículos</span><span>{totalQty}</span></div>
										<div className="flex justify-between"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
										<div className="flex justify-between"><span>Impuestos (12%)</span><span>{formatCurrency(taxes)}</span></div>
										<div className="flex justify-between pt-2 font-semibold border-t text-neutral-900"><span>Total estimado</span><span>{formatCurrency(total)}</span></div>
						</div>
						<div className="text-[11px] text-neutral-500 flex items-start gap-2"><i className='text-base bx bxs-truck text-carrot'/> Envío calculado en el checkout.</div>
						<a href="/checkout" className="w-full inline-flex justify-center items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-full bg-carrot text-nav hover:bg-carrot-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-carrot/60 transition">Continuar al pago <i className='text-base bx bx-lock'/></a>
									<button onClick={emptyCart} disabled={emptying || !items.length} className="w-full text-[11px] font-medium text-red-600 hover:text-red-700 disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/50 rounded">{emptying ? 'Vaciando…' : 'Vaciar carrito'}</button>
						<button onClick={load} disabled={loading} className="w-full text-[11px] text-neutral-500 hover:text-neutral-700 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-carrot/50 rounded">Actualizar</button>
					</aside>
				</div>
			)}
		</div>
	);
}
