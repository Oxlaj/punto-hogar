import { NextResponse } from 'next/server';
import { requirePermission } from '../../../../../src/lib/permissions';
import { invalidatePermissions } from '../../../../../src/lib/permissions';
import { logAudit } from '../../../../../src/lib/audit';

export async function POST(req: Request) {
  try {
    await requirePermission('role:update');
    const body = await req.json().catch(()=>({}));
    const userId = typeof body.userId === 'string' ? body.userId : undefined;
    invalidatePermissions(userId);
    logAudit('permissions.invalidate', 'PermissionCache', userId || '*');
    return NextResponse.json({ ok: true, scope: userId ? 'single' : 'all' });
  } catch (e: any) {
    if (e instanceof Error) {
      if (e.message === 'UNAUTHENTICATED') return NextResponse.json({ error: 'Unauthenticated', code: 'UNAUTHENTICATED' }, { status: 401 });
      if (e.message === 'FORBIDDEN') return NextResponse.json({ error: 'Forbidden', code: 'FORBIDDEN' }, { status: 403 });
    }
    return NextResponse.json({ error: 'Server error', code: 'SERVER_ERROR' }, { status: 500 });
  }
}
