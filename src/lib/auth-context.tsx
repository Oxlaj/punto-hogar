"use client";
import { createContext, useContext, useEffect, useState } from 'react';

interface Session { authenticated: boolean; sub?: string; email?: string; name?: string; role?: string }
const AuthCtx = createContext<Session>({ authenticated: false });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session>({ authenticated: false });
  useEffect(()=>{
    fetch('/api/auth/me').then(r=>r.json()).then(setSession).catch(()=>{});
  },[]);
  return <AuthCtx.Provider value={session}>{children}</AuthCtx.Provider>;
}

export function useAuth() { return useContext(AuthCtx); }
