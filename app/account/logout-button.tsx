"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../components/AuthProvider';

export default function LogoutButton(){
  const [loading, setLoading] = useState(false);
  const { logout } = useAuth();
  const router = useRouter();
  async function handle(){
    if(loading) return;
    setLoading(true);
    try {
  await logout();
  router.push('/');
  router.refresh();
    } catch {/* ignore */} finally { setLoading(false); }
  }
  return (
    <button
      onClick={handle}
      disabled={loading}
      className="px-4 py-2 text-sm font-medium text-white rounded bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
    >{loading ? 'Cerrando...' : 'Cerrar sesión'}</button>
  );
}
