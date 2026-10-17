"use client";
import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { mapApiError } from '../src/lib/client-errors';
import { formatCurrency } from '../src/lib/format';

type ProductOption = { id: string; name: string; price: string; category: string };
type SupplierOption = { id: string; businessName: string; products: ProductOption[] };
type PurchaseLine = { productId: string; purchaseQuantity: string; purchaseUnit: string; inventoryUnit: string; conversionFactor: string; unitCost: string };

export default function AdminPurchaseForm({ suppliers }: { suppliers: SupplierOption[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [supplierId, setSupplierId] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().slice(0, 10));
  const [invoiceReference, setInvoiceReference] = useState('');
  const [items, setItems] = useState<PurchaseLine[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const supplier = suppliers.find(item => item.id === supplierId);
  const available = supplier?.products.filter(product => !items.some(item => item.productId === product.id)) || [];
  const total = useMemo(() => items.reduce((sum, item) => sum + (Number(item.purchaseQuantity) || 0) * (Number(item.unitCost) || 0), 0), [items]);
  const addItem = () => {
    const product = available[0];
    if (!product) return;
    setItems(current => [...current, { productId: product.id, purchaseQuantity: '1', purchaseUnit: 'unidad', inventoryUnit: 'unidad', conversionFactor: '1', unitCost: '0' }]);
  };
  const updateItem = (index: number, key: keyof PurchaseLine, value: string) => setItems(current => current.map((item, i) => i === index ? { ...item, [key]: value } : item));
  const removeItem = (index: number) => setItems(current => current.filter((_, i) => i !== index));
  function submit(event: React.FormEvent) {
    event.preventDefault(); setError(null); setSuccess(null);
    if (!supplierId) return setError('Selecciona un proveedor.');
    if (!items.length) return setError('Agrega al menos un producto.');
    const payload = {
      supplierId, purchaseDate, invoiceReference: invoiceReference.trim() || null,
      items: items.map(item => ({ ...item, purchaseQuantity: Number(item.purchaseQuantity), conversionFactor: Number(item.conversionFactor), unitCost: Number(item.unitCost) }))
    };
    startTransition(async () => {
      try {
        const res = await fetch('/api/admin/purchases', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        if (!res.ok) throw new Error(mapApiError(await res.json().catch(() => null)));
        const purchase = await res.json();
        setSuccess('Compra pendiente registrada.');
        setTimeout(() => router.push(`/admin/purchases/${purchase.id}`), 500);
      } catch (err: any) { setError(err.message || 'No se pudo registrar la compra.'); }
    });
  }
  return <form onSubmit={submit} className="space-y-6" noValidate>
    <header><h1 className="text-2xl font-bold">Nueva compra</h1><p className="mt-1 text-sm text-neutral-600">Registra una compra pendiente sin modificar existencias.</p></header>
    {error && <div className="px-3 py-2 text-sm text-red-700 bg-red-100 rounded-md">{error}</div>}
    {success && <div className="px-3 py-2 text-sm text-green-700 bg-green-100 rounded-md">{success}</div>}
    <div className="grid gap-4 p-5 bg-white border rounded-xl md:grid-cols-3">
      <label className="flex flex-col gap-2 text-sm text-neutral-700">Proveedor<select value={supplierId} onChange={event => { setSupplierId(event.target.value); setItems([]); }} className="px-3 py-2 bg-white border rounded-md border-neutral-300"><option value="">Selecciona...</option>{suppliers.map(item => <option key={item.id} value={item.id}>{item.businessName}</option>)}</select></label>
      <label className="flex flex-col gap-2 text-sm text-neutral-700">Fecha<input type="date" value={purchaseDate} onChange={event => setPurchaseDate(event.target.value)} className="px-3 py-2 bg-white border rounded-md border-neutral-300" /></label>
      <label className="flex flex-col gap-2 text-sm text-neutral-700">Referencia de factura<input value={invoiceReference} onChange={event => setInvoiceReference(event.target.value)} className="px-3 py-2 bg-white border rounded-md border-neutral-300" /></label>
    </div>
    <div className="space-y-4">
      <div className="flex items-center justify-between"><h2 className="text-lg font-semibold">Productos</h2><button type="button" disabled={!available.length} onClick={addItem} className="px-3 py-2 text-sm font-semibold rounded bg-carrot text-nav disabled:opacity-50">Agregar producto</button></div>
      {items.map((item, index) => {
        const product = supplier?.products.find(option => option.id === item.productId);
        return <div key={`${item.productId}-${index}`} className="grid gap-3 p-4 bg-white border rounded-xl md:grid-cols-7">
          <label className="flex flex-col gap-1 text-xs text-neutral-600 md:col-span-2">Producto<select value={item.productId} onChange={event => updateItem(index, 'productId', event.target.value)} className="px-2 py-2 text-sm border rounded border-neutral-300">{supplier?.products.filter(option => option.id === item.productId || !items.some(other => other.productId === option.id)).map(option => <option key={option.id} value={option.id}>{option.name}</option>)}</select></label>
          <Field label="Cantidad compra" value={item.purchaseQuantity} onChange={value => updateItem(index, 'purchaseQuantity', value)} type="number" />
          <Field label="Unidad compra" value={item.purchaseUnit} onChange={value => updateItem(index, 'purchaseUnit', value)} />
          <Field label="Unidad inventario" value={item.inventoryUnit} onChange={value => updateItem(index, 'inventoryUnit', value)} />
          <Field label="Factor conversión" value={item.conversionFactor} onChange={value => updateItem(index, 'conversionFactor', value)} type="number" />
          <Field label="Costo unitario" value={item.unitCost} onChange={value => updateItem(index, 'unitCost', value)} type="number" />
          <div className="flex items-end justify-between gap-2 text-sm md:col-span-7"><span>Margen estimado: {product ? formatCurrency(Number(product.price) - (Number(item.unitCost) / (Number(item.conversionFactor) || 1))) : 'Q0.00'} por unidad de inventario</span><button type="button" onClick={() => removeItem(index)} className="text-xs text-red-600 hover:underline">Quitar</button></div>
        </div>;
      })}
      {!items.length && <p className="p-8 text-sm text-center border rounded-xl border-dashed text-neutral-500">Selecciona un proveedor y agrega productos.</p>}
    </div>
    <div className="flex items-center justify-between p-4 bg-white border rounded-xl"><span className="font-semibold">Total estimado</span><strong className="text-xl text-carrot-dark">{formatCurrency(total)}</strong></div>
    <div className="flex gap-3"><button disabled={pending} className="px-4 py-2 text-sm font-semibold rounded bg-carrot text-nav disabled:opacity-60">{pending ? 'Guardando...' : 'Registrar compra'}</button><button type="button" onClick={() => router.back()} className="px-4 py-2 text-sm border rounded border-neutral-300">Cancelar</button></div>
  </form>;
}

function Field({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return <label className="flex flex-col gap-1 text-xs text-neutral-600">{label}<input type={type} min={type === 'number' ? '0' : undefined} step={type === 'number' ? 'any' : undefined} value={value} onChange={event => onChange(event.target.value)} className="px-2 py-2 text-sm border rounded border-neutral-300" /></label>;
}
