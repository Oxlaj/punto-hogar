import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { clearSessionCookie } from '@/lib/auth';

export async function POST() {
  try {
    cookies().delete('auth_user_id');
    clearSessionCookie(); // elimina cookie 'session' si existe
  } catch {}
  return NextResponse.json({ ok: true });
}
