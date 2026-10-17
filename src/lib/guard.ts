import { getCurrentUser } from './auth-server';
import { getUserPermissions } from './permissions';

export interface PageGuardResult {
  user: Awaited<ReturnType<typeof getCurrentUser>>;
  perms: Set<string>;
  allowed: boolean;
}

// Require at least one of the provided permissions OR admin:access
export async function requirePagePermission(required: string | string[]): Promise<PageGuardResult> {
  const user = await getCurrentUser();
  if (!user) return { user: null as any, perms: new Set(), allowed: false };
  const perms = await getUserPermissions(user.id);
  const list = Array.isArray(required) ? required : [required];
  const allowed = perms.has('admin:access') || list.some(p => perms.has(p));
  return { user, perms, allowed };
}

// Require all of the provided permissions (still bypassed by admin:access)
export async function requireAllPagePermissions(required: string | string[]): Promise<PageGuardResult> {
  const user = await getCurrentUser();
  if (!user) return { user: null as any, perms: new Set(), allowed: false };
  const perms = await getUserPermissions(user.id);
  const list = Array.isArray(required) ? required : [required];
  const allowed = perms.has('admin:access') || list.every(p => perms.has(p));
  return { user, perms, allowed };
}

export async function requireAdministratorPage(): Promise<PageGuardResult> {
  const user = await getCurrentUser();
  if (!user) return { user: null as any, perms: new Set(), allowed: false };
  const perms = await getUserPermissions(user.id);
  return { user, perms, allowed: user.role === 'ADMIN' };
}
