"use client";
import { useRef, useState } from 'react';

export default function NewsletterForm() {
  const ref = useRef<HTMLInputElement|null>(null);
  const [status, setStatus] = useState<'idle'|'ok'|'error'>('idle');

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const email = ref.current?.value.trim();
    if (!email) return;
    // Aquí podrías hacer fetch a /api/newsletter (no implementado todavía)
    // Simulación rápida de éxito
    setStatus('ok');
    if (ref.current) ref.current.value = '';
    setTimeout(()=>setStatus('idle'), 3000);
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto flex flex-col gap-3 sm:flex-row max-w-md" aria-label="Formulario de suscripción">
      <input
        ref={ref}
        required
        type="email"
        placeholder="Tu email"
        className="flex-1 px-4 py-3 text-sm bg-white border rounded-full shadow-sm border-neutral-200 placeholder-neutral-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-carrot/60"
        aria-label="Correo electrónico"
      />
      <button
        type="submit"
        className="px-6 py-3 text-sm font-semibold rounded-full bg-carrot text-nav hover:bg-carrot-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-carrot/60 transition shadow-sm"
      >
        Suscribirme
      </button>
      {status === 'ok' && (
        <span className="sr-only" role="status">Suscripción registrada</span>
      )}
    </form>
  );
}
