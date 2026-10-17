import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-server';
import { currentUserPermissions } from '@/lib/permissions';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ authenticated: false });
  const permissions = await currentUserPermissions();
  return NextResponse.json({ authenticated: true, sub: user.id, email: user.email, name: user.name, role: user.role, permissions });
}
