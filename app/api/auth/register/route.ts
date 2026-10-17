import { NextResponse } from 'next/server';
import { prisma } from '../../../../src/lib/prisma';
import { hashPassword, createSessionCookie } from '../../../../src/lib/auth';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = String(body?.email || '').trim().toLowerCase();
    const password = String(body?.password || '');
    const name = String(body?.name || '').trim();
    if (!/.+@.+\..+/.test(email)) return NextResponse.json({ error: 'Email inválido' }, { status: 400 });
    if (password.length < 6) return NextResponse.json({ error: 'Contraseña muy corta' }, { status: 400 });
    const existing = await (prisma as any).user.findUnique({ where: { email } });
    if (existing) return NextResponse.json({ error: 'Email ya usado' }, { status: 409 });
    const passwordHash = await hashPassword(password);
    const user = await (prisma as any).user.create({ data: { email, passwordHash, name, role: 'USER' } });
    await createSessionCookie({ sub: user.id, email: user.email, role: user.role });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}
