import { NextResponse } from 'next/server';
import { prisma } from '../../../../../src/lib/prisma';
import { requireAdministrator, requirePermission } from '../../../../../src/lib/permissions';
import { FALLBACK_IMAGE, saveUploadedFile, slugify, deleteIfLocal } from '../../../../../src/lib/uploads';
import { logAudit } from '../../../../../src/lib/audit';
import { z } from 'zod';

export const runtime = 'nodejs';

function err(status: number, code: string, message?: string) { return NextResponse.json({ error: message || code, code }, { status }); }
const stockSchema = z.preprocess(
	value => typeof value === 'string' ? (value.trim() === '' ? Number.NaN : Number(value)) : value,
	z.number().int().min(0)
);

interface Params { params: { id: string } }

export async function GET(_: Request, { params }: Params) {
	try {
		await requirePermission('product:read');
		const product = await prisma.product.findUnique({ where: { id: params.id } });
		if (!product) return err(404,'NOT_FOUND');
		return NextResponse.json(product);
	} catch (e: any) {
		if (e instanceof Error) {
			if (e.message === 'UNAUTHENTICATED') return err(401,'UNAUTHENTICATED');
			if (e.message === 'FORBIDDEN') return err(403,'FORBIDDEN');
		}
		return err(500,'SERVER_ERROR');
	}
}

export async function PUT(req: Request, { params }: Params) {
	try {
		await requireAdministrator();
		await requirePermission('product:update');
		const contentType = req.headers.get('content-type') || '';
		let name = '';
		let price: any;
		let description: any = null;
		let categoryId = '';
		let active: any = true;
		let stock: unknown = 0;
		let imageUrl: string | null | undefined = undefined; // undefined keep, null remove, string set
		let file: File | null = null;
		let supplierId: string | null = null;

		if (contentType.includes('multipart/form-data')) {
			const form = await req.formData();
			name = String(form.get('name') || '').trim();
			price = form.get('price');
			description = (form.get('description') || '').toString().trim() || null;
			categoryId = String(form.get('categoryId') || '');
			active = String(form.get('active') || 'true') === 'true';
			stock = form.get('stock');
			supplierId = String(form.get('supplierId') || '').trim() || null;
			const removeFlag = form.get('removeImage');
			if (removeFlag === 'true') imageUrl = null;
			const f = form.get('image');
			if (f instanceof File && f.size > 0) file = f;
		} else {
			const body = await req.json();
			name = (body.name||'').trim();
			price = body.price;
			description = body.description || null;
			categoryId = body.categoryId;
			active = body.active ?? true;
			stock = body.stock ?? 0;
			imageUrl = body.imageUrl; // could be undefined/null/string
			supplierId = typeof body.supplierId === 'string' && body.supplierId.trim() ? body.supplierId.trim() : null;
		}

		if (!name || !price || !categoryId) return err(400,'MISSING_FIELDS');
		const numericPrice = Number(price);
		if (Number.isNaN(numericPrice)) return err(400,'INVALID_PRICE');
		const parsedStock = stockSchema.safeParse(stock);
		if (!parsedStock.success) return err(400,'INVALID_STOCK','Stock must be a non-negative integer');
		const slug = slugify(name);

		const existing = await prisma.product.findUnique({ where: { id: params.id }, select: { imageUrl: true } });
		if (!existing) return err(404,'NOT_FOUND');

		let finalImage = existing.imageUrl || FALLBACK_IMAGE;
		let oldImageToDelete: string | null = null;

		if (file) {
			try {
				const saved = await saveUploadedFile(file,'items', slug);
				if (existing.imageUrl && existing.imageUrl !== FALLBACK_IMAGE) oldImageToDelete = existing.imageUrl;
				finalImage = saved.relativePath;
			} catch (uploadErr: any) {
				if (uploadErr instanceof Error) {
					if (uploadErr.message === 'FILE_TOO_LARGE') return err(400,'FILE_TOO_LARGE');
					if (uploadErr.message === 'INVALID_MIME') return err(400,'INVALID_MIME');
					if (uploadErr.message === 'INVALID_EXT') return err(400,'INVALID_EXT');
				}
				return err(500,'UPLOAD_FAILED');
			}
		} else if (imageUrl === null) {
			if (existing.imageUrl && existing.imageUrl !== FALLBACK_IMAGE) oldImageToDelete = existing.imageUrl;
			finalImage = FALLBACK_IMAGE;
		}
		// if imageUrl undefined -> keep existing, if string provided (not handled separately) future branch could set explicit URL

		const product = await prisma.$transaction(async tx => {
			if (supplierId) {
				const supplier = await tx.supplier.findFirst({ where: { id: supplierId, active: true }, select: { id: true } });
				if (!supplier) throw new Error('INVALID_SUPPLIER');
				await tx.productSupplier.updateMany({
					where: { productId: params.id, isPrimary: true, supplierId: { not: supplierId } },
					data: { isPrimary: false }
				});
				await tx.productSupplier.upsert({
					where: { productId_supplierId: { productId: params.id, supplierId } },
					update: { isPrimary: true },
					create: { productId: params.id, supplierId, isPrimary: true }
				});
			} else {
				await tx.productSupplier.updateMany({ where: { productId: params.id, isPrimary: true }, data: { isPrimary: false } });
			}
			return tx.product.update({ where: { id: params.id }, data: { name, slug, price: numericPrice, description, categoryId, imageUrl: finalImage, stock: parsedStock.data } });
		});
		logAudit('product.update','Product', product.id, { name });
		if (oldImageToDelete) deleteIfLocal(oldImageToDelete);
		return NextResponse.json(product);
	} catch (e: any) {
		if (e instanceof Error) {
			if (e.message === 'UNAUTHENTICATED') return err(401,'UNAUTHENTICATED');
			if (e.message === 'FORBIDDEN') return err(403,'FORBIDDEN');
			if (e.message === 'INVALID_SUPPLIER') return err(400,'INVALID_SUPPLIER','Proveedor activo no válido');
		}
		return err(500,'SERVER_ERROR','Error updating');
	}
}

export async function DELETE(_: Request, { params }: Params) {
	try {
		await requirePermission('product:delete');
		const existing = await prisma.product.findUnique({ where: { id: params.id }, select: { imageUrl: true } });
		if (!existing) return err(404,'NOT_FOUND');
		await prisma.product.delete({ where: { id: params.id } });
		logAudit('product.delete','Product', params.id);
		if (existing.imageUrl && existing.imageUrl !== FALLBACK_IMAGE) deleteIfLocal(existing.imageUrl);
		return NextResponse.json({ ok: true });
	} catch (e: any) {
		if (e instanceof Error) {
			if (e.message === 'UNAUTHENTICATED') return err(401,'UNAUTHENTICATED');
			if (e.message === 'FORBIDDEN') return err(403,'FORBIDDEN');
		}
		return err(500,'SERVER_ERROR','Error deleting');
	}
}
