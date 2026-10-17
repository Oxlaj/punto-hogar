export interface CartItem { productId: string; qty: number }
export interface CartData { items: CartItem[] }

export async function getCart(): Promise<CartData> {
  const res = await fetch('/api/cart', { cache: 'no-store' });
  handleError(res, 'No se pudo obtener carrito');
  return res.json();
}

export async function addToCart(productId: string, qty: number = 1) {
  const res = await fetch('/api/cart', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ productId, qty }) });
  handleError(res, 'No se pudo agregar');
  const data = await res.json();
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('cart:updated'));
  return data;
}

export async function updateItem(productId: string, qty: number) {
  const res = await fetch('/api/cart', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ productId, qty }) });
  handleError(res, 'No se pudo actualizar');
  const data = await res.json();
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('cart:updated'));
  return data;
}

export async function removeItem(productId: string) {
  const res = await fetch('/api/cart', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ productId }) });
  handleError(res, 'No se pudo eliminar');
  const data = await res.json();
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('cart:updated'));
  return data;
}
export interface CartData { items: CartItem[]; subtotal?: number; enriched?: EnrichedCartItem[] }
export interface EnrichedCartItem extends CartItem { name: string; price: number; lineTotal: number }

function handleError(res: Response, fallbackMsg: string) {
  if (!res.ok) throw new Error(fallbackMsg);
}

// Optimistic helpers
export function optimisticAdd(local: CartData, productId: string, qty: number = 1): CartData {
  const existing = local.items.find(i => i.productId === productId);
  if (existing) existing.qty += qty; else local.items.push({ productId, qty });
  return { ...local };
}

export function optimisticUpdate(local: CartData, productId: string, qty: number): CartData {
  const idx = local.items.findIndex(i => i.productId === productId);
  if (idx !== -1) {
    if (qty <= 0) local.items.splice(idx, 1); else local.items[idx].qty = qty;
  }
  return { ...local };
}

export function optimisticRemove(local: CartData, productId: string): CartData {
  return { ...local, items: local.items.filter(i => i.productId !== productId) };
}

// Orders
export interface CreateOrderInput { customer: string; email: string; phone: string; address: string }
export async function createOrder(data: CreateOrderInput) {
  const res = await fetch('/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (res.status === 422) {
    const j = await res.json();
    const err: any = new Error('Validación');
    err.fields = j.fields || {};
    throw err;
  }
  handleError(res, 'No se pudo crear orden');
  const order = await res.json();
  // El servidor limpia la cookie; aquí notificamos al cliente para refrescar cualquier UI dependiente
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('cart:updated'));
  }
  return order;
}
