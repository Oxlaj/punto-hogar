import { NextResponse } from 'next/server';
import { prisma } from '../../../src/lib/prisma';

export async function GET() {
	try {
		// Use cast to any in case local prisma client not regenerated yet
		const categories = await (prisma as any).category.findMany({
			where: { active: true },
			select: { id: true, name: true, slug: true, imageUrl: true },
			orderBy: { name: 'asc' }
		});
		return NextResponse.json({ categories });
	} catch (e) {
		return NextResponse.json({ categories: [], error: 'Error interno' }, { status: 500 });
	}
}
