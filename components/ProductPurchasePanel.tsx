"use client";
import { useState } from 'react';
import { addToCart } from '../src/lib/cart';
import { showToast } from 'nextjs-toast-notify';

interface Props {
  productId: string;
  productName: string;
  priceFormatted: string;
  stock: number;
  active: boolean;
}

export default function ProductPurchasePanel({ productId, productName, priceFormatted, stock, active }: Props) {
  const [qty, setQty] = useState(1);
  const [adding, setAdding] = useState(false);
  const available = active && stock > 0;

  function dec() { setQty(q => Math.max(1, q - 1)); }
  function inc() { setQty(q => Math.min(stock, 99, q + 1)); }

  async function handleAdd() {
    if (adding) return;
    setAdding(true);
    try {
      await addToCart(productId, qty);
      showToast.success(`${productName} x${qty} agregado`, { duration: 2300, position: 'top-right' });
    } catch (e: any) {
      showToast.error(e?.message || 'Error al agregar', { duration: 3000, position: 'top-right' });
    } finally { setAdding(false); }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-baseline gap-4">
        <span className="text-3xl font-semibold tracking-tight text-neutral-900">{priceFormatted}</span>
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center overflow-hidden rounded-full border border-neutral-300 bg-neutral-50">
          <button type="button" aria-label="Reducir" onClick={dec} className="px-4 h-10 text-neutral-600 hover:bg-neutral-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-carrot/60">-</button>
          <span className="px-3 h-10 flex items-center font-medium text-neutral-800 select-none text-sm min-w-[2.5rem] justify-center">{qty}</span>
          <button type="button" aria-label="Incrementar" onClick={inc} disabled={!available || qty >= stock} className="px-4 h-10 text-neutral-600 hover:bg-neutral-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-carrot/60 disabled:opacity-40 disabled:cursor-not-allowed">+</button>
        </div>
        <button
          type="button"
          onClick={handleAdd}
          disabled={adding || !available}
          className="inline-flex items-center gap-2 px-8 h-10 rounded-full bg-carrot text-nav text-sm font-semibold tracking-wide shadow-sm hover:bg-carrot-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-carrot/70 disabled:opacity-60 disabled:cursor-not-allowed transition"
        >
          {adding && <i className='bx bx-loader-alt animate-spin text-base' />}
          {adding ? 'Agregando…' : available ? 'Añadir al carrito' : 'Agotado'}
        </button>
      </div>
      <div className={`text-sm font-medium ${available ? 'text-emerald-700' : 'text-red-600'}`}>
        {available ? `Stock disponible: ${stock}` : active ? 'Producto agotado' : 'Producto no disponible'}
      </div>
      <div className="text-[11px] text-neutral-500 flex items-center gap-2">
        <i className='bx bxs-truck text-carrot text-base' /> Envío rápido y seguimiento disponible.
      </div>
    </div>
  );
}
