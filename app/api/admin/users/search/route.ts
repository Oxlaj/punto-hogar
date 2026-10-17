import { NextResponse } from 'next/server';
import { prisma } from '../../../../../src/lib/prisma';
import { requireAdministrator, requirePermission } from '../../../../../src/lib/permissions';

export async function GET(req: Request) {
  try {
    await requireAdministrator();
    await requirePermission('user:read');
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get('q') || '').trim();
    if (!q) return NextResponse.json([]);
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { email: { contains: q, mode: 'insensitive' } },
          { id: { contains: q } },
          { name: { contains: q, mode: 'insensitive' } }
        ]
      },
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: { id: true, email: true, name: true }
    });
    return NextResponse.json(users);
  } catch (e:any) {
    if (e instanceof Error) {
      if (e.message === 'UNAUTHENTICATED') return NextResponse.json({ error: 'UNAUTHENTICATED', code: 'UNAUTHENTICATED' }, { status: 401 });
      if (e.message === 'FORBIDDEN') return NextResponse.json({ error: 'FORBIDDEN', code: 'FORBIDDEN' }, { status: 403 });
    }
    return NextResponse.json({ error: 'SERVER_ERROR', code: 'SERVER_ERROR' }, { status: 500 });
  }
}