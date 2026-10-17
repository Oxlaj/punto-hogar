import Link from 'next/link';
import { prisma } from '../../../src/lib/prisma';
import { getSession } from '../../../src/lib/auth';
import { getUserPermissions } from '../../../src/lib/permissions';

export const dynamic = 'force-dynamic';

interface SearchParams { page?: string; per?: string; q?: string; active?: string }
const DEFAULT_PER = 20; const MAX_PER = 100;
function parsePagination(sp: SearchParams) {
	const page = Math.max(parseInt(sp.page || '1', 10) || 1, 1);
	let per = parseInt(sp.per || String(DEFAULT_PER), 10) || DEFAULT_PER;
	per = Math.min(Math.max(5, per), MAX_PER);
	return { page, per };
}

export default async function AdminProductsPage({ searchParams }: { searchParams: SearchParams }) {
	// Permissions server-side to conditionally render buttons/links
	const session = await getSession();
	let canCreate = false; let canUpdate = false;
	if (session) {
		const perms = await getUserPermissions(session.sub);
		canCreate = perms.has('admin:access') || perms.has('product:create');
		canUpdate = perms.has('admin:access') || perms.has('product:update');
	}
	const { page, per } = parsePagination(searchParams);
	const q = (searchParams.q || '').trim();
	const activeParam = (searchParams.active || 'all').trim(); // 'true' | 'false' | 'all'
	const where: any = {};
	if (activeParam && activeParam !== 'all') where.active = activeParam === 'true';
	if (q) {
		where.AND = (where.AND || []).concat([
			{ OR: [
				{ name: { contains: q, mode: 'insensitive' } },
				{ description: { contains: q, mode: 'insensitive' } }
			]}
		]);
	}
	const total = await prisma.product.count({ where });
	const totalPages = Math.max(1, Math.ceil(total / per));
	const currentPage = Math.min(page, totalPages);
	const products = await prisma.product.findMany({
		where,
		include: { category: true },
		orderBy: { createdAt: 'desc' },
		skip: (currentPage - 1) * per,
		take: per
	});
	const start = total === 0 ? 0 : (currentPage - 1) * per + 1;
	const end = Math.min(total, currentPage * per);
	return (
		<div className="space-y-8">
			<header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div className="space-y-1">
					<h1 className="text-2xl font-bold tracking-tight">Productos</h1>
					<p className="text-sm text-neutral-600">Gestiona los items disponibles en la tienda. {total>0 && <span className="text-neutral-500">Mostrando {start}-{end} de {total}</span>}</p>
				</div>
				{canCreate && <Link href="/admin/products/new" className="px-4 py-2 text-sm font-semibold rounded bg-carrot text-nav hover:bg-carrot-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nav">Nuevo</Link>}
			</header>
			{/* Toolbar de filtros */}
			<div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
				<form action="/admin/products" method="get" className="flex flex-1 items-center gap-2">
					<input
						type="text"
						name="q"
						defaultValue={q}
						placeholder="Buscar productos..."
						className="flex-1 px-4 py-2 rounded-md border border-neutral-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-neutral-400"
					/>
					<select
						name="active"
						defaultValue={['true','false','all'].includes(activeParam)? activeParam : 'all'}
						className="px-3 py-2 rounded-md border border-neutral-300 bg-white text-sm"
						aria-label="Estado"
					>
						<option value="all">Todos</option>
						<option value="true">Activos</option>
						<option value="false">Inactivos</option>
					</select>
					<button type="submit" className="px-4 py-2 text-sm font-semibold rounded bg-carrot text-nav hover:bg-carrot-dark">Aplicar</button>
				</form>
			</div>
			<div className="overflow-auto border rounded-lg shadow-sm bg-surface">
				<table className="w-full text-sm text-left align-middle">
					<thead className="text-[11px] uppercase tracking-wide bg-neutral-50 text-neutral-500">
						<tr>
							<th className="px-3 py-2 font-medium">Nombre</th>
							<th className="px-3 py-2 font-medium">Categoría</th>
							<th className="px-3 py-2 font-medium">Precio</th>
							<th className="px-3 py-2 font-medium">Stock</th>
							<th className="px-3 py-2 font-medium">Creado</th>
							<th className="px-3 py-2" />
						</tr>
					</thead>
					<tbody className="divide-y">
						{products.map((p: any) => (
							<tr key={p.id} className="hover:bg-neutral-50">
								<td className="px-3 py-2 font-medium text-neutral-800 max-w-[260px] truncate" title={p.name}>{p.name}</td>
								<td className="px-3 py-2 text-neutral-600">{p.category?.name}</td>
								<td className="px-3 py-2 font-mono text-xs text-neutral-700">Q{p.price?.toString?.() ?? p.price}</td>
								<td className={`px-3 py-2 font-mono text-xs ${p.stock === 0 ? 'text-red-600' : 'text-neutral-700'}`}>{p.stock}</td>
								<td className="px-3 py-2 text-xs text-neutral-600 whitespace-nowrap">{new Date(p.createdAt).toLocaleDateString()}</td>
								<td className="px-3 py-2 text-right">
									{canUpdate && <Link href={`/admin/products/${p.id}`} className="text-xs font-medium text-carrot hover:underline">Editar</Link>}
								</td>
							</tr>
						))}
						{products.length === 0 && (
							<tr><td colSpan={5} className="px-4 py-8 text-sm text-center text-neutral-500">Sin productos</td></tr>
						)}
					</tbody>
				</table>
			</div>
			{totalPages > 1 && <Pagination base="/admin/products" current={currentPage} totalPages={totalPages} per={per} q={q} active={activeParam} />}
			<PerPageSelector base="/admin/products" per={per} q={q} active={activeParam} />
		</div>
	);
}

interface PaginationProps { base: string; current: number; totalPages: number; per: number; q?: string; active?: string }
function Pagination({ base, current, totalPages, per, q, active }: PaginationProps) {
	function link(p: number) {
		const params = new URLSearchParams();
		if (p > 1) params.set('page', String(p));
		if (per !== DEFAULT_PER) params.set('per', String(per));
		if (q) params.set('q', q);
		if (active && active !== 'all') params.set('active', active);
		const qs = params.toString(); return qs ? `${base}?${qs}` : base;
	}
	const window = 2; const pages: number[] = [];
	for (let i = Math.max(1, current - window); i <= Math.min(totalPages, current + window); i++) pages.push(i);
	if (!pages.includes(1)) pages.unshift(1);
	if (!pages.includes(totalPages)) pages.push(totalPages);
	const seq: (number|'gap')[] = []; pages.sort((a,b)=>a-b).forEach((p,i,arr)=>{ if(i>0 && p - arr[i-1] > 1) seq.push('gap'); seq.push(p); });
	return (
		<nav aria-label="Paginación" className="flex flex-wrap items-center gap-1 pt-2 text-xs">
			<a aria-disabled={current===1} className={`px-3 py-1 rounded border ${current===1?'cursor-not-allowed text-neutral-400 border-neutral-200':'border-neutral-300 hover:bg-neutral-100'}`} href={current===1? undefined: link(current-1)}>«</a>
			{seq.map((it,i)=> it==='gap'? <span key={i} className="px-2">…</span> : (
				<a key={it} href={link(it)} aria-current={it===current?'page':undefined} className={`px-3 py-1 rounded border ${it===current? 'bg-carrot text-nav border-carrot font-semibold':'border-neutral-300 hover:bg-neutral-100'}`}>{it}</a>
			))}
			<a aria-disabled={current===totalPages} className={`px-3 py-1 rounded border ${current===totalPages?'cursor-not-allowed text-neutral-400 border-neutral-200':'border-neutral-300 hover:bg-neutral-100'}`} href={current===totalPages? undefined: link(current+1)}>»</a>
		</nav>
	);
}

function PerPageSelector({ base, per, q, active }: { base: string; per: number; q?: string; active?: string }) {
	const options = [10,20,50,100];
	return (
		<div className="text-[11px] text-neutral-500 flex items-center gap-1 pt-2 flex-wrap">Filas por página:
			{options.map(o => {
				const params = new URLSearchParams();
				if (o !== DEFAULT_PER) params.set('per', String(o));
				if (q) params.set('q', q);
				if (active && active !== 'all') params.set('active', active);
				const href = `${base}?${params.toString()}`.replace(/\?$/, '');
				return <a key={o} href={href} className={`px-2 py-1 rounded border ${o===per? 'bg-carrot text-nav border-carrot font-semibold':'border-neutral-300 hover:bg-neutral-100'}`}>{o}</a>;
			})}
		</div>
	);
}
