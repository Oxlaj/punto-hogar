import { prisma } from '../src/lib/prisma';
import ProductCard from '../components/ProductCard';
import NewsletterForm from '../components/NewsletterForm';

// Podríamos optar por ISR, pero mientras tanto mantenemos dinámico para reflejar cambios inmediatos.
export const dynamic = 'force-dynamic';

async function getFeaturedProducts() {
  try {
    return await prisma.product.findMany({
      where: { active: true },
      orderBy: { createdAt: 'desc' },
      take: 6,
      include: { category: { select: { name: true } } }
    });
  } catch {
    return [];
  }
}

async function getTopCategories() {
  try {
    return await prisma.category.findMany({
      where: { active: true },
      orderBy: { createdAt: 'asc' },
      take: 4
    });
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const [products, categories] = await Promise.all([
    getFeaturedProducts(),
    getTopCategories()
  ]);

  return (
    <main className="space-y-28">
      <section aria-labelledby="hero-heading" className="overflow-hidden rounded-2xl bg-white border border-line">
        <div className="grid items-center gap-8 px-6 py-12 mx-auto max-w-6xl sm:px-10 md:grid-cols-[1fr_auto] md:py-16">
          <div className="max-w-2xl space-y-6">
            <span className="inline-flex items-center gap-2 px-3 py-1 text-xs font-semibold tracking-wide rounded-full bg-carrot/15 text-brand">
              <i className="bx bxs-home" aria-hidden="true" /> Soluciones para tu hogar
            </span>
            <h1 id="hero-heading" className="text-4xl font-extrabold leading-tight tracking-tight text-brand sm:text-5xl">
              Todo lo que necesitas para tu hogar
            </h1>
            <p className="max-w-xl text-base leading-relaxed text-ink/75">
              Encuentra herramientas, artículos y soluciones confiables para cada proyecto.
            </p>
            <a href="/products" className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white transition rounded-lg bg-carrot hover:bg-carrot-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-carrot">
              Ver productos <i className="bx bx-right-arrow-alt text-lg" aria-hidden="true" />
            </a>
          </div>
          <div className="flex items-center justify-center p-6 rounded-2xl bg-brand/5">
            <img src="/logo-punto-hogar.png" alt="Punto Hogar" className="object-contain w-auto h-auto max-w-[min(18rem,70vw)] max-h-28" />
          </div>
        </div>
      </section>

      {/* CATEGORÍAS DESTACADAS */}
      <section id="categorias" aria-labelledby="cat-heading" className="px-6">
        <div className="max-w-6xl mx-auto space-y-10">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 id="cat-heading" className="text-2xl font-semibold tracking-tight md:text-3xl">Categorías para tu hogar</h2>
            <a href="/categories" className="px-3 py-1 text-sm font-medium text-black transition-colors rounded bg-carrot hover:bg-carrot-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-carrot/60">Ver todas →</a>
          </div>
          {categories.length === 0 && (
            <div className="text-sm text-neutral-500">Aún no hay categorías activas.</div>
          )}
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4">
            {categories.map(c => {
              return (
                <a key={c.id} href={`/categories/${c.slug}`} className="relative overflow-hidden transition border group rounded-xl bg-neutral-100 border-neutral-200 hover:border-carrot/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-carrot/60">
                  <div className="flex items-center justify-between h-40 p-4 bg-brand">
                    <h3 className="text-sm font-medium tracking-wide text-white transition group-hover:text-carrot">{c.name}</h3>
                    <span className="text-[11px] text-white/70 group-hover:text-white">Ver</span>
                  </div>
                </a>
              );
            })}
          </div>
        </div>
      </section>

      {/* PRODUCTOS DESTACADOS */}
      <section id="productos" aria-labelledby="prod-heading" className="px-6">
        <div className="max-w-6xl mx-auto space-y-10">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 id="prod-heading" className="text-2xl font-semibold tracking-tight md:text-3xl">Productos destacados</h2>
            <a href="/products" className="px-3 py-1 text-sm font-medium text-black transition-colors rounded bg-carrot hover:bg-carrot-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-carrot/60">Ver catálogo completo →</a>
          </div>
          {products.length === 0 && (
            <div className="text-sm text-neutral-500">No hay productos disponibles todavía.</div>
          )}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:gap-5">
            {products.map((p: any) => <ProductCard key={p.id} product={p} variant="compact" />)}
          </div>
        </div>
      </section>

      {/* VALUE PROPS */}
      <section aria-labelledby="val-heading" className="px-6">
        <div className="max-w-6xl mx-auto space-y-10">
          <h2 id="val-heading" className="text-2xl font-semibold tracking-tight md:text-3xl">Por qué elegirnos</h2>
          <div className="grid gap-6 md:grid-cols-4 sm:grid-cols-2">
            {[
              { icon: 'bxs-wrench', title: 'Herramientas confiables', desc: 'Productos prácticos y resistentes para tus proyectos.' },
              { icon: 'bxs-home', title: 'Soluciones para el hogar', desc: 'Encuentra artículos útiles para cada espacio de tu casa.' },
              { icon: 'bxs-truck', title: 'Envío ágil', desc: 'Procesamos y enviamos tus pedidos rápidamente.' },
              { icon: 'bxs-check-shield', title: 'Compra segura', desc: 'Te ayudamos a elegir productos adecuados para cada necesidad.' }
            ].map(v => (
              <div key={v.title} className="relative flex flex-col gap-3 p-5 bg-white border shadow-sm rounded-xl border-neutral-200">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-carrot/15 text-carrot">
                  <i className={`bx ${v.icon} text-xl`} />
                </div>
                <h3 className="text-sm font-semibold tracking-wide">{v.title}</h3>
                <p className="text-xs leading-relaxed text-neutral-600">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BANNER CTA */}
      <section aria-labelledby="cta-heading" className="px-6">
        <div className="relative max-w-6xl mx-auto overflow-hidden rounded-2xl">
          <div className="absolute inset-0 bg-gradient-to-r from-carrot to-brand opacity-90" />
          <div className="relative flex flex-col items-center gap-10 px-8 py-14 md:py-16 md:flex-row text-nav">
            <div className="max-w-xl space-y-5">
              <h2 id="cta-heading" className="text-2xl font-bold tracking-tight sm:text-3xl">Haz realidad tus proyectos</h2>
              <p className="text-sm sm:text-base text-nav/80 max-w-prose">Suscríbete y recibe novedades, promociones y consejos para tu hogar.</p>
              <a href="#newsletter" className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white transition rounded-full bg-nav hover:bg-nav-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60">
                Ver novedades <i className='text-base bx bx-right-arrow-alt' />
              </a>
            </div>
            <div className="relative items-center justify-center hidden w-full max-w-xs aspect-square sm:flex">
              <div className="absolute inset-0 border rounded-3xl border-nav/20 bg-white/10 backdrop-blur" />
              <img src="/logo-punto-hogar.png" alt="Punto Hogar" className="relative object-contain w-auto max-w-[75%] max-h-24" />
            </div>
          </div>
        </div>
      </section>

      {/* NEWSLETTER */}
      <section id="newsletter" aria-labelledby="news-heading" className="px-6 pb-10">
        <div className="max-w-3xl mx-auto space-y-8 text-center">
          <div className="space-y-3">
            <h2 id="news-heading" className="text-2xl font-semibold tracking-tight md:text-3xl">Mantente al día</h2>
            <p className="mx-auto text-sm text-neutral-600 max-w-prose">Promociones exclusivas, nuevos productos y consejos para el hogar. Sin spam.</p>
          </div>
          <NewsletterForm />
          <p className="text-[11px] text-neutral-500">Puedes cancelar la suscripción en cualquier momento.</p>
        </div>
      </section>
    </main>
  );
}
