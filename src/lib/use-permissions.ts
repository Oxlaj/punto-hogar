"use client";
import { useEffect, useState, useCallback } from 'react';

export interface PermissionsState {
  loading: boolean;
  permissions: Set<string>;
  can: (perm: string) => boolean;
  canAny: (perms: string[]) => boolean;
  refresh: () => Promise<void>;
}

export function usePermissions(): PermissionsState {
  const [permissions, setPermissions] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/auth/me', { cache: 'no-store' });
      if (!res.ok) { setPermissions(new Set()); return; }
      const data = await res.json();
      if (data?.permissions && Array.isArray(data.permissions)) {
        setPermissions(new Set(data.permissions));
      } else {
        setPermissions(new Set());
      }
    } finally { setLoading(false); }
  }, []);

  useEffect(()=> { load(); }, [load]);

  function can(perm: string) {
    return permissions.has('admin:access') || permissions.has(perm);
  }
  function canAny(perms: string[]) {
    if (permissions.has('admin:access')) return true;
    return perms.some(p => permissions.has(p));
  }

  return { loading, permissions, can, canAny, refresh: load };
}
