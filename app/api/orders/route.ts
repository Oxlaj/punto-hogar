import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth-server';

const CART_COOKIE = 'cart';

function readCart(): { items: { productId: string; qty: number }[] } {
	const raw = cookies().get(CART_COOKIE)?.value;
	if (!raw) return { items: [] };
	try {
		const parsed = JSON.parse(raw);
		if (Array.isArray(parsed.items)) return { items: parsed.items.filter((i: any) => i && i.productId && i.qty > 0) };
		return { items: [] };
	} catch { return { items: [] }; }
}

function clearCart() {
	cookies().set(CART_COOKIE, JSON.stringify({ items: [] }), { path: '/', httpOnly: false, sameSite: 'lax' });
}

class InventoryValidationError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'InventoryValidationError';
	}
}

export async function POST(req: NextRequest) {
	try {
		const body = await req.json().catch(()=>null) as any;
		const errors: Record<string,string> = {};
		function reqField(field: string, min=1) {
			const v = body?.[field];
			if (typeof v !== 'string' || v.trim().length < min) errors[field] = `Requerido (min ${min})`;
			return v as string | undefined;
		}
		const customer = reqField('customer', 2);
		const email = reqField('email', 5);
		const phone = reqField('phone', 5);
		const address = reqField('address', 5);
		// Validaciones específicas
		if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Email inválido';
		if (phone && !/^[+0-9 ()-]{5,}$/.test(phone)) errors.phone = 'Teléfono inválido';
		if (Object.keys(errors).length) return new Response(JSON.stringify({ error: 'Validación', fields: errors }), { status: 422 });
		const cart = readCart();
		if (cart.items.length === 0) return new Response(JSON.stringify({ error: 'Carrito vacío' }), { status: 400 });
		// Usuario autenticado (si existe cookie auth_user_id)
		const currentUser = await getCurrentUser();
		const userId = currentUser?.id;
		const quantities = new Map<string, number>();
		for (const item of cart.items) {
			if (!Number.isInteger(item.qty) || item.qty < 1) {
				return new Response(JSON.stringify({ error: 'Cantidad inválida' }), { status: 400 });
			}
			quantities.set(item.productId, (quantities.get(item.productId) || 0) + item.qty);
		}

		const order = await prisma.$transaction(async transaction => {
			const products = await transaction.product.findMany({
				where: { id: { in: Array.from(quantities.keys()) } },
				select: { id: true, price: true, name: true, slug: true, active: true }
			});
			if (products.length !== quantities.size) throw new InventoryValidationError('Productos no encontrados');
			const map = new Map(products.map(product => [product.id, product]));
			const orderItemsData = Array.from(quantities, ([productId, quantity]) => {
				const product = map.get(productId)!;
				if (!product.active) throw new InventoryValidationError('Producto inactivo');
				return { productId, quantity, unitPrice: Number(product.price), name: product.name, slug: product.slug };
			});

			for (const item of orderItemsData) {
				const updated = await transaction.product.updateMany({
					where: { id: item.productId, active: true, stock: { gte: item.quantity } },
					data: { stock: { decrement: item.quantity } }
				});
				if (updated.count !== 1) throw new InventoryValidationError('Stock insuficiente');
			}

			const subtotal = orderItemsData.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
			const createdOrder = await transaction.order.create({
				data: {
					customer: customer!,
					email: email!,
					address: address!,
					phone: phone!,
					subtotal,
					total: subtotal,
					userId,
					items: { create: orderItemsData }
				},
				include: { items: true }
			});
			await transaction.auditLog.create({
				data: {
					action: 'inventory.stock.decremented',
					entity: 'Order',
					entityId: createdOrder.id,
					userId,
					metadata: { quantities: orderItemsData.map(item => ({ productId: item.productId, quantity: item.quantity })) }
				}
			});
			return createdOrder;
		});
		clearCart();
		return new Response(JSON.stringify(order), { status: 201, headers: { 'Content-Type': 'application/json' } });
	} catch (e: any) {
		if (e instanceof InventoryValidationError) {
			return new Response(JSON.stringify({ error: e.message }), { status: 409, headers: { 'Content-Type': 'application/json' } });
		}
		return new Response(JSON.stringify({ error: 'No se pudo crear orden', detalle: e.message }), { status: 500 });
	}
}
