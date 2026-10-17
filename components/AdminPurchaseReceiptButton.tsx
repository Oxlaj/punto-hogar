"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { mapApiError } from '../src/lib/client-errors';

export default function AdminPurchaseReceiptButton({ purchaseId }: { purchaseId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function receive() {
    if (!window.confirm('¿Confirmar recepción? Esta acción incrementará el inventario una sola vez.')) return;
    setPending(true); setError(null);
    try {
      const response = await fetch(`/api/admin/purchases/${purchaseId}/receive`, { method: 'POST' });
      if (!response.ok) throw new Error(mapApiError(await response.json().catch(() => null)));
      router.refresh();
    } catch (err: any) { setError(err.message || 'No se pudo recibir la compra.'); } finally { setPending(false); }
  }
  return <div className="space-y-2"><button onClick={receive} disabled={pending} className="w-full px-4 py-2 text-sm font-semibold rounded bg-carrot text-nav disabled:opacity-60">{pending ? 'Procesando...' : 'Confirmar recepción'}</button>{error && <p className="text-xs text-red-600">{error}</p>}</div>;
}
