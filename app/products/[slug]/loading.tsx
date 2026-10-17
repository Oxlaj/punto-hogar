export default function ProductSlugLoading() {
	return (
		<div className="max-w-6xl px-5 mx-auto animate-pulse">
			{/* Breadcrumb skeleton */}
			<div className="flex flex-wrap items-center gap-2 my-6 text-xs">
				<div className="h-3 w-12 rounded bg-neutral-200" />
				<span className="text-neutral-300">/</span>
				<div className="h-3 w-20 rounded bg-neutral-200" />
				<span className="text-neutral-300">/</span>
				<div className="h-3 w-24 rounded bg-neutral-200" />
			</div>
			<div className="grid gap-12 md:grid-cols-2">
				{/* Image placeholder */}
				<div className="space-y-4">
					<div className="relative overflow-hidden border shadow-sm aspect-square rounded-2xl bg-neutral-100 border-neutral-200 flex items-center justify-center">
						<div className="w-1/2 h-8 bg-neutral-200 rounded" />
					</div>
					<div className="flex gap-3">
						<div className="h-16 flex-1 rounded-xl bg-neutral-100 border border-neutral-200" />
						<div className="h-16 flex-1 rounded-xl bg-neutral-100 border border-neutral-200" />
						<div className="h-16 flex-1 rounded-xl bg-neutral-100 border border-neutral-200" />
					</div>
				</div>
				{/* Info */}
				<div className="flex flex-col gap-10">
					<header className="space-y-5">
						<div className="h-8 w-3/4 rounded bg-neutral-200" />
						<div className="space-y-2">
							<div className="h-3 w-full rounded bg-neutral-200" />
							<div className="h-3 w-5/6 rounded bg-neutral-200" />
							<div className="h-3 w-2/3 rounded bg-neutral-200" />
						</div>
					</header>
					{/* Purchase Panel skeleton */}
						<div className="p-5 border rounded-xl bg-white/60 backdrop-blur border-neutral-200 space-y-5">
							<div className="flex items-center gap-4">
								<div className="h-7 w-24 rounded bg-neutral-200" />
								<div className="h-7 w-20 rounded bg-neutral-200" />
							</div>
							<div className="flex items-center gap-3">
								<div className="h-9 w-32 rounded-full bg-neutral-200" />
								<div className="h-9 flex-1 rounded-md bg-carrot/40" />
							</div>
						</div>
					<section className="space-y-3">
						<div className="h-4 w-32 rounded bg-neutral-200" />
						<div className="space-y-2">
							<div className="h-3 w-40 rounded bg-neutral-200" />
							<div className="h-3 w-28 rounded bg-neutral-200" />
						</div>
					</section>
				</div>
			</div>
		</div>
	);
}
