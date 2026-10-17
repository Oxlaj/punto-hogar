"use client";
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { mapApiError } from '../src/lib/client-errors';

type SupplierValues = {
  id?: string; businessName: string; nit: string; contactName: string; phone: string;
  email: string; address: string; active: boolean; notes: string;
};

export default function AdminSupplierForm({ initial, mode = 'create' }: { initial?: Partial<SupplierValues> | null; mode?: 'create' | 'edit' }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [values, setValues] = useState<SupplierValues>({
    id: initial?.id, businessName: initial?.businessName || '', nit: initial?.nit || '', contactName: initial?.contactName || '',
    phone: initial?.phone || '', email: initial?.email || '', address: initial?.address || '', active: initial?.active ?? true, notes: initial?.notes || ''
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const update = <K extends keyof SupplierValues>(key: K, value: SupplierValues[K]) => setValues(current => ({ ...current, [key]: value }));
  function submit(event: React.FormEvent) {
    event.preventDefault(); setError(null); setSuccess(null);
    if (!values.businessName.trim()) { setError('El nombre comercial es obligatorio.'); return; }
    startTransition(async () => {
      try {
        const url = values.id ? `/api/admin/suppliers/${values.id}` : '/api/admin/suppliers';
        const res = await fetch(url, { method: values.id ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(values) });
        if (!res.ok) throw new Error(mapApiError(await res.json().catch(() => null)));
        setSuccess(values.id ? 'Proveedor actualizado.' : 'Proveedor creado.');
        setTimeout(() => { router.push('/admin/suppliers'); router.refresh(); }, 500);
      } catch (err: any) { setError(err.message || 'No se pudo guardar el proveedor.'); }
    });
  }
  return <form onSubmit={submit} className="max-w-3xl space-y-6" noValidate>
    <header><h1 className="text-2xl font-bold">{mode === 'edit' ? 'Editar proveedor' : 'Nuevo proveedor'}</h1><p className="mt-1 text-sm text-neutral-600">Administra datos de contacto sin crear compras.</p></header>
    {error && <div className="px-3 py-2 text-sm text-red-700 bg-red-100 rounded-md">{error}</div>}
    {success && <div className="px-3 py-2 text-sm text-green-700 bg-green-100 rounded-md">{success}</div>}
    <div className="grid gap-5 p-5 bg-white border rounded-xl md:grid-cols-2">
      <Field label="Nombre comercial *" value={values.businessName} onChange={value => update('businessName', value)} />
      <Field label="NIT (opcional)" value={values.nit} onChange={value => update('nit', value)} />
      <Field label="Contacto (opcional)" value={values.contactName} onChange={value => update('contactName', value)} />
      <Field label="Teléfono (opcional)" value={values.phone} onChange={value => update('phone', value)} />
      <Field label="Correo (opcional)" type="email" value={values.email} onChange={value => update('email', value)} />
      <Field label="Dirección (opcional)" value={values.address} onChange={value => update('address', value)} />
      <label className="flex items-center gap-2 text-sm text-neutral-700"><input type="checkbox" checked={values.active} onChange={event => update('active', event.target.checked)} /> Proveedor activo</label>
      <label className="flex flex-col gap-2 text-sm text-neutral-700 md:col-span-2">Observaciones<textarea value={values.notes} onChange={event => update('notes', event.target.value)} rows={4} className="px-3 py-2 border rounded-md border-neutral-300 focus:outline-none focus:ring-2 focus:ring-carrot/50" /></label>
    </div>
    <div className="flex gap-3"><button disabled={pending} className="px-4 py-2 text-sm font-semibold rounded bg-carrot text-nav hover:bg-carrot-dark disabled:opacity-60">{pending ? 'Guardando...' : 'Guardar'}</button><button type="button" onClick={() => router.back()} className="px-4 py-2 text-sm border rounded border-neutral-300 hover:bg-neutral-100">Cancelar</button></div>
  </form>;
}

function Field({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return <label className="flex flex-col gap-2 text-sm text-neutral-700">{label}<input type={type} value={value} onChange={event => onChange(event.target.value)} className="px-3 py-2 bg-white border rounded-md border-neutral-300 focus:outline-none focus:ring-2 focus:ring-carrot/50" /></label>;
}
