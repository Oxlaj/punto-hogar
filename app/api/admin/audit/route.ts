import { NextResponse } from 'next/server';
import { prisma } from '../../../../src/lib/prisma';
import { requirePermission } from '../../../../src/lib/permissions';

export const dynamic = 'force-dynamic';

// GET /api/admin/audit?limit=50&cursor=<id>&q=
// Devuelve últimos registros con paginación por cursor.
export async function GET(req: Request) {
  try {
    await requirePermission('audit:read');
    const { searchParams } = new URL(req.url);
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '50', 10) || 50, 1), 200);
    const cursor = searchParams.get('cursor') || undefined;
    const q = (searchParams.get('q') || '').trim();
    const where: any = {};
    if (q) {
      where.OR = [
        { action: { contains: q, mode: 'insensitive' } },
        { entity: { contains: q, mode: 'insensitive' } },
        { entityId: { contains: q } },
        { user: { email: { contains: q, mode: 'insensitive' } } as any }
      ];
    }
    const rows = await prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      include: { user: { select: { email: true } } }
    });
    const hasMore = rows.length > limit;
    const items = hasMore ? rows.slice(0, limit) : rows;
    const nextCursor = hasMore ? items[items.length - 1].id : null;
    return NextResponse.json({
      items: items.map(l => ({
        id: l.id,
        createdAt: l.createdAt.toISOString(),
        userEmail: l.user?.email || null,
        action: l.action,
        entity: l.entity,
        entityId: l.entityId,
        metadata: l.metadata
      })),
      nextCursor
    });
  } catch (e:any) {
    if (e instanceof Error) {
      if (e.message === 'UNAUTHENTICATED') return NextResponse.json({ error: 'UNAUTHENTICATED', code: 'UNAUTHENTICATED' }, { status: 401 });
      if (e.message === 'FORBIDDEN') return NextResponse.json({ error: 'FORBIDDEN', code: 'FORBIDDEN' }, { status: 403 });
    }
    return NextResponse.json({ error: 'SERVER_ERROR', code: 'SERVER_ERROR' }, { status: 500 });
  }
}
