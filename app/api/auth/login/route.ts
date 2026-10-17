import { NextResponse } from 'next/server';
import { prisma } from '../../../../src/lib/prisma';
import { verifyPassword, createSessionCookie } from '../../../../src/lib/auth';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = String(body?.email || '').trim().toLowerCase();
    const password = String(body?.password || '');
    const user = await (prisma as any).user.findUnique({ where: { email } });
    if (!user) return NextResponse.json({ error: 'Credenciales incorrectas' }, { status: 401 });
    const ok = await verifyPassword(password, user.passwordHash);
    if (!ok) return NextResponse.json({ error: 'Credenciales incorrectas' }, { status: 401 });
    await createSessionCookie({ sub: user.id, email: user.email, role: user.role });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}
