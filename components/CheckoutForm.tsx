"use client";
import { useState, useEffect } from 'react';
import { createOrder } from '../src/lib/cart';
import { formatCurrency } from '../src/lib/format';
import { useAuth } from './AuthProvider';
import { useRouter } from 'next/navigation';

interface Props { subtotal: number }

export default function CheckoutForm({ subtotal }: Props) {
  const [form, setForm] = useState({ customer: '', email: '', phone: '', address: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string|null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string,string>>({});
  const { session } = useAuth();

  useEffect(()=>{
    if (session) {
      setForm(f => ({ ...f, email: f.email || session.email || '', customer: f.customer || '' }));
    }
  },[session]);
  const router = useRouter();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    setFieldErrors({});
    try {
      const order = await createOrder(form);
      router.push(`/orders/${order.id}`);
    } catch (e: any) {
      if (e?.fields) setFieldErrors(e.fields);
      setError(e.message || 'Error creando orden');
    } finally { setLoading(false); }
  }

  function set<K extends keyof typeof form>(key: K, value: string) { setForm(f => ({ ...f, [key]: value })); }

  return (
    <form onSubmit={onSubmit} className="space-y-5 p-5 border rounded-lg bg-surface shadow-sm">
      <h2 className="text-lg font-semibold text-nav">Datos de envío</h2>
      <div className="space-y-3">
        <div>
          <input required value={form.customer} onChange={e=>set('customer', e.target.value)} placeholder="Nombre" className="w-full border rounded px-3 py-2 text-sm bg-white/90 focus:outline-none focus:ring-2 focus:ring-carrot focus:border-carrot transition" />
          {fieldErrors.customer && <p className="text-[10px] text-red-600 mt-0.5">{fieldErrors.customer}</p>}
        </div>
        <div>
          <input required type="email" value={form.email} onChange={e=>set('email', e.target.value)} placeholder="Email" className="w-full border rounded px-3 py-2 text-sm bg-white/90 focus:outline-none focus:ring-2 focus:ring-carrot focus:border-carrot transition" />
          {fieldErrors.email && <p className="text-[10px] text-red-600 mt-0.5">{fieldErrors.email}</p>}
        </div>
        <div>
          <input required value={form.phone} onChange={e=>set('phone', e.target.value)} placeholder="Teléfono" className="w-full border rounded px-3 py-2 text-sm bg-white/90 focus:outline-none focus:ring-2 focus:ring-carrot focus:border-carrot transition" />
          {fieldErrors.phone && <p className="text-[10px] text-red-600 mt-0.5">{fieldErrors.phone}</p>}
        </div>
        <div>
          <textarea required value={form.address} onChange={e=>set('address', e.target.value)} placeholder="Dirección" className="w-full border rounded px-3 py-2 text-sm min-h-[80px] bg-white/90 focus:outline-none focus:ring-2 focus:ring-carrot focus:border-carrot transition" />
          {fieldErrors.address && <p className="text-[10px] text-red-600 mt-0.5">{fieldErrors.address}</p>}
        </div>
      </div>
      <div className="text-sm flex justify-between font-medium">
        <span>Subtotal:</span>
        <span>{formatCurrency(subtotal)}</span>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
      <button type="submit" disabled={loading} className="w-full px-4 py-2 text-sm font-semibold text-nav rounded bg-carrot hover:bg-carrot-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nav disabled:opacity-50 disabled:cursor-not-allowed transition">
        {loading ? 'Procesando…' : 'Confirmar orden'}
      </button>
    </form>
  );
}
