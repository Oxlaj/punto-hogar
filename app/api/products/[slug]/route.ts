import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../src/lib/prisma';

export const dynamic = 'force-dynamic';

// GET /api/products/:slugOrId (público)
// Devuelve un único producto activo por slug o id.
export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const key = decodeURIComponent(params.slug);

    const product = await prisma.product.findFirst({
      where: {
        active: true,
        OR: [ { slug: key }, { id: key } ]
      },
      include: { category: { select: { id: true, name: true, slug: true } } }
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Opcional: cache público breve para mejorar TTFB (respeta invalidación SSR)
    const res = NextResponse.json(product);
    res.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=60');
    return res;
  } catch (e: any) {
    return NextResponse.json({ error: 'Error fetching product', details: e.message }, { status: 500 });
  }
}
