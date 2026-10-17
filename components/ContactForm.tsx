"use client";
import { useState } from 'react';
import { showToast } from 'nextjs-toast-notify';

interface Fields { name: string; email: string; message: string }

export default function ContactForm() {
  const [form, setForm] = useState<Fields>({ name: '', email: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string|null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string,string>>({});
  const [sent, setSent] = useState(false);

  function update<K extends keyof Fields>(key: K, value: string) {
    setForm(f => ({ ...f, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError(null); setFieldErrors({});
    try {
      const res = await fetch('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      if (res.status === 422) {
        const j = await res.json();
        setFieldErrors(j.fields || {}); setError('Revisa los campos');
        showToast.error('Revisa los campos', { duration: 2500, position: 'top-right' });
      } else if (!res.ok) {
        const j = await res.json().catch(()=>({}));
        setError(j.error || 'Error enviando');
        showToast.error(j.error || 'Error enviando', { duration: 2800, position: 'top-right' });
      } else {
        setSent(true); setForm({ name: '', email: '', message: '' });
        showToast.success('Mensaje enviado', { duration: 2200, position: 'top-right' });
      }
    } catch (e: any) {
      setError('Error de red');
      showToast.error('Error de red', { duration: 2800, position: 'top-right' });
    } finally { setLoading(false); }
  }

  return (
    <form onSubmit={onSubmit} className="max-w-md p-5 space-y-4 border rounded-lg shadow-sm bg-surface" noValidate>
      <h2 className="text-lg font-semibold text-nav">Escríbenos</h2>
      {sent && !error && <p className="text-xs text-green-600">Recibimos tu mensaje. Te responderemos pronto.</p>}
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="space-y-3">
        <div>
          <input value={form.name} onChange={e=>update('name', e.target.value)} placeholder="Nombre" required className={`w-full px-3 py-2 text-sm rounded border bg-white/90 focus:outline-none focus:ring-2 focus:ring-carrot focus:border-carrot transition ${fieldErrors.name?'border-red-500':''}`} />
          {fieldErrors.name && <p className="mt-0.5 text-[10px] text-red-600">{fieldErrors.name}</p>}
        </div>
        <div>
          <input type="email" value={form.email} onChange={e=>update('email', e.target.value)} placeholder="Email" required className={`w-full px-3 py-2 text-sm rounded border bg-white/90 focus:outline-none focus:ring-2 focus:ring-carrot focus:border-carrot transition ${fieldErrors.email?'border-red-500':''}`} />
          {fieldErrors.email && <p className="mt-0.5 text-[10px] text-red-600">{fieldErrors.email}</p>}
        </div>
        <div>
          <textarea value={form.message} onChange={e=>update('message', e.target.value)} placeholder="Mensaje" required rows={5} className={`w-full px-3 py-2 text-sm rounded border bg-white/90 focus:outline-none focus:ring-2 focus:ring-carrot focus:border-carrot transition resize-y ${fieldErrors.message?'border-red-500':''}`} />
          {fieldErrors.message && <p className="mt-0.5 text-[10px] text-red-600">{fieldErrors.message}</p>}
        </div>
      </div>
      <button disabled={loading} className="w-full px-4 py-2 text-sm font-semibold rounded bg-carrot text-nav hover:bg-carrot-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nav disabled:opacity-50 disabled:cursor-not-allowed">
        {loading ? 'Enviando…' : 'Enviar mensaje'}
      </button>
    </form>
  );
}
