import { prisma } from '../../src/lib/prisma';
import ProductCard from '../../components/ProductCard';
import Link from 'next/link';
import SearchToolbar from '../../components/SearchToolbar';

export const dynamic = 'force-dynamic';

interface ProductsPageProps { searchParams: { page?: string; per?: string; sort?: string; cat?: string; priceMin?: string; priceMax?: string } }

const DEFAULT_PER = 12;
const MAX_PER = 48;

function parsePagination(searchParams: ProductsPageProps['searchParams']) {
	const page = Math.max(1, parseInt(searchParams.page || '1', 10) || 1);
	let per = parseInt(searchParams.per || String(DEFAULT_PER), 10) || DEFAULT_PER;
	per = Math.min(Math.max(4, per), MAX_PER);
	return { page, per };
}

function parsePrice(value?: string) {
	if (!value || !/^\d+(?:\.\d+)?$/.test(value)) return undefined;
	const parsed = Number(value);
	return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
}

async function getProductsPaginated(page: number, per: number, searchParams: ProductsPageProps['searchParams']) {
	const priceMin = parsePrice(searchParams.priceMin);
	const priceMax = parsePrice(searchParams.priceMax);
	const invalidPrice =
		(searchParams.priceMin !== undefined && priceMin === undefined) ||
		(searchParams.priceMax !== undefined && priceMax === undefined) ||
		(priceMin !== undefined && priceMax !== undefined && priceMin > priceMax);
	const cat = searchParams.cat?.trim();
	const sort = searchParams.sort || 'new';
	const where: any = { active: true };
	if (cat) where.category = { slug: cat };
	if (invalidPrice) {
		where.price = { gte: 1, lte: 0 };
	} else if (priceMin !== undefined && priceMax !== undefined && priceMin <= priceMax) {
		where.price = { gte: priceMin, lte: priceMax };
	} else if (priceMin !== undefined && priceMax !== undefined) {
		where.price = { gte: 1, lte: 0 };
	} else if (priceMin !== undefined && priceMax === undefined) {
		where.price = { gte: priceMin };
	} else if (priceMax !== undefined && priceMin === undefined) {
		where.price = { lte: priceMax };
	}
	let orderBy: any = { createdAt: 'desc' };
	if (sort === 'price_asc') orderBy = { price: 'asc' };
	else if (sort === 'price_desc') orderBy = { price: 'desc' };
	else if (sort === 'name') orderBy = { name: 'asc' };
	const total = await prisma.product.count({ where });
	const totalPages = Math.max(1, Math.ceil(total / per));
	// Clamp page
	const safePage = Math.min(page, totalPages);
	const skip = (safePage - 1) * per;
	const products = await prisma.product.findMany({
		where,
		skip,
		take: per,
		include: { category: { select: { name: true } } },
		orderBy
	});
	const bounds = await prisma.product.aggregate({ where: { active: true }, _min: { price: true }, _max: { price: true } });
	const categories = await prisma.category.findMany({ where: { active: true }, select: { id: true, name: true, slug: true }, orderBy: { name: 'asc' } });
	return {
		products, total, totalPages, page: safePage, per, categories,
		minBound: bounds._min.price ? Number(bounds._min.price) : 0,
		maxBound: bounds._max.price ? Number(bounds._max.price) : 0,
		priceMin, priceMax, cat, sort
	};
}

function buildPageLink(base: string, page: number, per: number, searchParams: ProductsPageProps['searchParams']) {
	const params = new URLSearchParams();
	if (page > 1) params.set('page', String(page));
	if (per !== DEFAULT_PER) params.set('per', String(per));
	for (const key of ['sort', 'cat', 'priceMin', 'priceMax']) {
		if (searchParams[key as keyof typeof searchParams]) params.set(key, searchParams[key as keyof typeof searchParams] as string);
	}
	const qs = params.toString();
	return qs ? `${base}?${qs}` : base;
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
	const { page, per } = parsePagination(searchParams);
	const data = await getProductsPaginated(page, per, searchParams);
	const { products, total, totalPages, page: currentPage, categories, minBound, maxBound, priceMin, priceMax, cat, sort } = data;
	const start = total === 0 ? 0 : (currentPage - 1) * per + 1;
	const end = Math.min(total, currentPage * per);

	return (
		<div className="space-y-10">
			<header className="space-y-3">
				<h1 className="text-4xl font-extrabold">Productos</h1>
				<div className="text-sm text-neutral-600">
					{total === 0 ? 'Sin productos.' : `Mostrando ${start}–${end} de ${total}`}
				</div>
				<SearchToolbar
					q=""
					sort={sort}
					per={per}
					cat={cat || ''}
					categories={categories}
					priceMin={priceMin}
					priceMax={priceMax}
					minBound={minBound}
					maxBound={maxBound}
					base="/products"
				/>
			</header>

			{/* Grid */}
			<div className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4">
				{products.map((p: any) => <ProductCard key={p.id} product={p} />)}
				{products.length === 0 && <p className="text-sm col-span-full text-neutral-600">Sin productos.</p>}
			</div>

			{/* Pagination */}
			{totalPages > 1 && (
				<nav aria-label="Paginación" className="flex flex-wrap items-center justify-center gap-2 pt-4">
					<PaginationControl current={currentPage} totalPages={totalPages} per={per} searchParams={searchParams} />
				</nav>
			)}

			{/* Page size selector */}
			<div className="pt-2 text-center">
				<span className="text-[11px] text-neutral-500">Items por página: </span>
				{[12, 24, 36, 48].map(n => (
					<Link
						key={n}
						href={buildPageLink('/products', 1, n, searchParams)}
						className={`inline-block px-3 py-1 text-[11px] rounded-full border transition ml-1 ${n===per?'bg-carrot text-nav border-carrot':'border-neutral-300 hover:bg-neutral-100'}`}
					>{n}</Link>
				))}
			</div>
		</div>
	);
}

interface PaginationControlProps { current: number; totalPages: number; per: number; searchParams: ProductsPageProps['searchParams'] }
function PaginationControl({ current, totalPages, per, searchParams }: PaginationControlProps) {
	const pages: number[] = [];
	const window = 2; // pages around current
	const first = 1;
	const last = totalPages;
	for (let p = Math.max(first, current - window); p <= Math.min(last, current + window); p++) pages.push(p);
	// Ensure ends
	if (!pages.includes(first)) pages.unshift(first);
	if (!pages.includes(last)) pages.push(last);
	// Remove duplicates & sort
	const unique = Array.from(new Set(pages)).sort((a,b)=>a-b);
	const items: (number | 'gap')[] = [];
	unique.forEach((p,i) => {
		if (i>0 && p - unique[i-1] > 1) items.push('gap');
		items.push(p);
	});

	function link(page: number) {
		const params = new URLSearchParams();
		if (page > 1) params.set('page', String(page));
		if (per !== DEFAULT_PER) params.set('per', String(per));
		for (const key of ['sort', 'cat', 'priceMin', 'priceMax']) {
			if (searchParams[key as keyof typeof searchParams]) params.set(key, searchParams[key as keyof typeof searchParams] as string);
		}
		const qs = params.toString();
		return qs ? `/products?${qs}` : '/products';
	}

	return (
		<div className="flex flex-wrap items-center gap-1">
			<Link
				href={link(Math.max(1, current - 1))}
				aria-disabled={current===1}
				className={`px-3 py-1.5 text-xs rounded-full border transition ${current===1?'border-neutral-200 text-neutral-400 cursor-not-allowed':'border-neutral-300 hover:bg-neutral-100'}`}
				aria-label="Anterior"
			>«</Link>
			{items.map((it, idx) => it === 'gap' ? (
				<span key={idx} className="px-2 text-xs select-none text-neutral-400">…</span>
			) : (
				<Link
					key={it}
					href={link(it)}
						aria-current={it===current? 'page':undefined}
					className={`px-3 py-1.5 text-xs rounded-full border transition ${it===current? 'bg-carrot text-nav border-carrot font-semibold':'border-neutral-300 hover:bg-neutral-100'}`}
				>{it}</Link>
			))}
			<Link
				href={link(Math.min(totalPages, current + 1))}
				aria-disabled={current===totalPages}
				className={`px-3 py-1.5 text-xs rounded-full border transition ${current===totalPages?'border-neutral-200 text-neutral-400 cursor-not-allowed':'border-neutral-300 hover:bg-neutral-100'}`}
				aria-label="Siguiente"
			>»</Link>
		</div>
	);
}
