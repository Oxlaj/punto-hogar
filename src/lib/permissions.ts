import { prisma } from './prisma';
import { getSession } from './auth';

// Simple in-memory cache (per server instance) for user permissions
interface CacheEntry { set: Set<string>; ts: number }
const cache = new Map<string, CacheEntry>();
const TTL = 60 * 1000; // 1 min

export async function getUserPermissions(userId: string) {
  const c = cache.get(userId);
  if (c && Date.now() - c.ts < TTL) return c.set;
  const rows = await prisma.userRole.findMany({
    where: { userId },
    include: { role: { include: { rolePerms: { include: { permission: true } } } } }
  });
  const set = new Set<string>();
  for (const r of rows) {
    for (const rp of r.role.rolePerms) set.add(rp.permission.key);
  }
  cache.set(userId, { set, ts: Date.now() });
  return set;
}

function authError(kind: 'UNAUTHENTICATED' | 'FORBIDDEN') {
  const e = new Error(kind);
  return e;
}

export async function requirePermission(key: string) {
  const session = await getSession();
  if (!session) throw authError('UNAUTHENTICATED');
  const perms = await getUserPermissions(session.sub);
  if (perms.has('admin:access') || perms.has(key)) return true;
  throw authError('FORBIDDEN');
}

export async function requireAdministrator() {
  const session = await getSession();
  if (!session) throw authError('UNAUTHENTICATED');
  const user = await prisma.user.findUnique({ where: { id: session.sub }, select: { id: true, role: true } });
  if (!user || user.role !== 'ADMIN') throw authError('FORBIDDEN');
  return user;
}

export async function requireAny(keys: string[]) {
  const session = await getSession();
  if (!session) throw authError('UNAUTHENTICATED');
  const perms = await getUserPermissions(session.sub);
  if (perms.has('admin:access') || keys.some(k => perms.has(k))) return true;
  throw authError('FORBIDDEN');
}

export async function requireAll(keys: string[]) {
  const session = await getSession();
  if (!session) throw authError('UNAUTHENTICATED');
  const perms = await getUserPermissions(session.sub);
  if (perms.has('admin:access') || keys.every(k => perms.has(k))) return true;
  throw authError('FORBIDDEN');
}

export async function currentUserPermissions() {
  const session = await getSession();
  if (!session) return [] as string[];
  const perms = await getUserPermissions(session.sub);
  return Array.from(perms);
}

// Invalidate cache for a single user or all users
export function invalidatePermissions(userId?: string) {
  if (userId) cache.delete(userId); else cache.clear();
}
