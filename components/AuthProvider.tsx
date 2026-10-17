"use client";
import { createContext, useCallback, useContext, useEffect, useState } from 'react';

type Session = { sub: string; email: string; role: 'USER' | 'ADMIN'; permissions: string[] } | null;

interface AuthContextValue {
	session: Session;
	loading: boolean;
	refresh: () => Promise<void>;
	logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
	const [session, setSession] = useState<Session>(null);
	const [loading, setLoading] = useState(true);

	const load = useCallback(async () => {
		try {
			const res = await fetch('/api/auth/me', { cache: 'no-store' });
			if (!res.ok) { setSession(null); return; }
			const data = await res.json();
			if (data && data.authenticated) {
				setSession({ sub: data.sub, email: data.email, role: (data.role || 'USER'), permissions: Array.isArray(data.permissions)? data.permissions: [] });
			} else {
				setSession(null);
			}
		} catch {
			setSession(null);
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => { load(); }, [load]);

	const logout = useCallback(async () => {
		await fetch('/api/auth/logout', { method: 'POST' });
		setSession(null);
		if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('auth:changed'));
		await load();
	}, [load]);

	// Listen for external auth changes (e.g., manual cookie clear)
	useEffect(()=>{
		function handler(){ load(); }
		window.addEventListener('auth:changed', handler);
		return ()=> window.removeEventListener('auth:changed', handler);
	}, [load]);

	const value: AuthContextValue = { session, loading, refresh: load, logout };
	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
	const ctx = useContext(AuthContext);
	if (!ctx) throw new Error('useAuth must be used within AuthProvider');
	return ctx;
}
