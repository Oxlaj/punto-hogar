import { NextResponse } from 'next/server';
import { prisma } from '../../../../../src/lib/prisma';
import { requirePermission } from '../../../../../src/lib/permissions';
import { FALLBACK_IMAGE, saveUploadedFile, slugify, deleteIfLocal } from '../../../../../src/lib/uploads';
import { logAudit } from '../../../../../src/lib/audit';

export const runtime = 'nodejs';

function err(status: number, code: string, message?: string) {
  return NextResponse.json({ error: message || code, code }, { status });
}

interface Params { params: { id: string } }

export async function GET(_: Request, { params }: Params) {
	try {
		await requirePermission('category:read');
		const category = await prisma.category.findUnique({ where: { id: params.id } });
		if (!category) return err(404,'NOT_FOUND','Not found');
		return NextResponse.json(category);
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
		await requirePermission('category:update');
		const contentType = req.headers.get('content-type') || '';
		let name = '';
		let active: any = true;
		let file: File | null = null;
		let removeImage = false;

		if (contentType.includes('multipart/form-data')) {
			const form = await req.formData();
			name = String(form.get('name') || '').trim();
			active = String(form.get('active') || 'true') === 'true';
			const f = form.get('image');
			if (f instanceof File && f.size > 0) file = f;
			removeImage = form.get('removeImage') === 'true';
		} else {
			const body = await req.json();
			name = (body.name||'').trim();
			active = body.active ?? true;
			removeImage = body.removeImage === true;
		}
		if (!name) return err(400,'NAME_REQUIRED','Name required');
		const slug = slugify(name);

		const existing = await prisma.category.findUnique({ where: { id: params.id }, select: { imageUrl: true } });
		if (!existing) return err(404,'NOT_FOUND');
		let finalImage = existing.imageUrl || FALLBACK_IMAGE;
		let oldImageToDelete: string | null = null;

		if (file) {
			try {
				const saved = await saveUploadedFile(file,'media/categories', slug);
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
		} else if (removeImage) {
			if (existing.imageUrl && existing.imageUrl !== FALLBACK_IMAGE) oldImageToDelete = existing.imageUrl;
			finalImage = FALLBACK_IMAGE;
		}

		const category = await prisma.category.update({ where: { id: params.id }, data: { name, slug, active, imageUrl: finalImage } });
		logAudit('category.update','Category', category.id, { name });
		if (oldImageToDelete) deleteIfLocal(oldImageToDelete); // fire & forget
		return NextResponse.json(category);
	} catch (e: any) {
		if (e instanceof Error) {
			if (e.message === 'UNAUTHENTICATED') return err(401,'UNAUTHENTICATED');
			if (e.message === 'FORBIDDEN') return err(403,'FORBIDDEN');
		}
		return err(500,'SERVER_ERROR','Error updating');
	}
}

export async function DELETE(_: Request, { params }: Params) {
	try {
		await requirePermission('category:delete');
		const existing = await prisma.category.findUnique({
			where: { id: params.id },
			select: { imageUrl: true, products: { select: { active: true } } }
		});
		if (!existing) return err(404,'NOT_FOUND');

		const activeProducts = existing.products.filter(product => product.active).length;
		if (activeProducts > 0) {
			return err(409, 'ACTIVE_PRODUCTS', 'No se puede eliminar la categoría porque tiene productos activos asociados.');
		}
		if (existing.products.length > 0) {
			return err(409, 'INACTIVE_PRODUCTS', 'No se puede eliminar la categoría porque tiene productos inactivos asociados. Consérvalos y desactiva la categoría.');
		}

		await prisma.category.delete({ where: { id: params.id } });
		logAudit('category.delete','Category', params.id);
		if (existing.imageUrl && existing.imageUrl !== FALLBACK_IMAGE) deleteIfLocal(existing.imageUrl);
		return NextResponse.json({ ok: true });
	} catch (e: any) {
		if (e instanceof Error) {
			if (e.message === 'UNAUTHENTICATED') return err(401,'UNAUTHENTICATED');
			if (e.message === 'FORBIDDEN') return err(403,'FORBIDDEN');
		}
		if (e?.code === 'P2003') {
			return err(409, 'CATEGORY_IN_USE', 'No se puede eliminar la categoría porque conserva productos relacionados.');
		}
		return err(500,'SERVER_ERROR','Error deleting');
	}
}
