"use client";
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { mapApiError } from '../src/lib/client-errors';
import { usePermissions } from '../src/lib/use-permissions';

interface CategoryFormValues {
	id?: string;
	name: string;
	slug: string;
	active: boolean;
	imageUrl?: string; // stored image path only
}

interface AdminCategoryFormProps {
	initial?: Partial<CategoryFormValues> | null;
	mode?: 'create' | 'edit';
}

export default function AdminCategoryForm({ initial, mode = 'create' }: AdminCategoryFormProps) {
	const router = useRouter();
	const [isPending, startTransition] = useTransition();
	const [values, setValues] = useState<CategoryFormValues>({
		id: initial?.id,
		name: initial?.name || '',
		slug: initial?.slug || '',
		active: initial?.active ?? true,
		imageUrl: initial?.imageUrl || ''
	});
	const [errors, setErrors] = useState<Record<string,string>>({});
	const [serverError, setServerError] = useState<string| null>(null);
	const [serverSuccess, setServerSuccess] = useState<string| null>(null);
	const [file, setFile] = useState<File|null>(null);
	const [filePreview, setFilePreview] = useState<string|null>(null);
	const [removeImage, setRemoveImage] = useState(false);
	const { can } = usePermissions();
	const cannotEdit = values.id ? !can('category:update') : !can('category:create');

	function validate(v: CategoryFormValues) {
		const e: Record<string,string> = {};
		if (!v.name.trim()) e.name = 'Nombre requerido';
		if (!v.slug.trim()) e.slug = 'Slug requerido';
		if (v.slug && !/^[a-z0-9-]+$/.test(v.slug)) e.slug = 'Solo minúsculas, números y -';
		return e;
	}

	function resetImage() {
		if (filePreview) URL.revokeObjectURL(filePreview);
		setFile(null); setFilePreview(null);
	}

	function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
		const f = e.target.files?.[0];
		if (!f) { resetImage(); return; }
		if (filePreview) URL.revokeObjectURL(filePreview);
		setFile(f); setFilePreview(URL.createObjectURL(f));
		setRemoveImage(false);
	}

	async function onSubmit(ev: React.FormEvent) {
		ev.preventDefault();
		setServerError(null); setServerSuccess(null);
		const e = validate(values); setErrors(e);
		if (Object.keys(e).length) return;
		const needsMultipart = !!file || removeImage;
		startTransition( async () => {
			try {
				let res: Response;
				const url = values.id ? `/api/admin/categories/${values.id}` : '/api/admin/categories';
				if (needsMultipart) {
					const form = new FormData();
					form.append('name', values.name.trim());
					form.append('active', String(values.active));
					if (file) form.append('image', file);
					if (removeImage) form.append('removeImage','true');
					res = await fetch(url, { method: values.id ? 'PUT':'POST', body: form });
				} else {
					const payload = { name: values.name.trim(), active: values.active };
					res = await fetch(url, { method: values.id ? 'PUT':'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify(payload) });
				}

				if (!res.ok) {
					const data = await res.json().catch(()=>null);
					throw new Error(mapApiError(data));
				}
				setServerSuccess(values.id? 'Categoría actualizada':'Categoría creada');
				setTimeout(()=>{ router.push('/admin/categories'); router.refresh(); }, 700);
			} catch(err:any) { setServerError(err.message || 'Error'); }
		});
	}

	async function onDelete() {
		if (!values.id || isPending || !can('category:delete')) return;
		if (!window.confirm('¿Eliminar esta categoría? La operación no elimina productos relacionados.')) return;
		setServerError(null);
		setServerSuccess(null);
		startTransition(async () => {
			try {
				const res = await fetch(`/api/admin/categories/${values.id}`, { method: 'DELETE' });
				if (!res.ok) {
					const data = await res.json().catch(() => null);
					throw new Error(mapApiError(data));
				}
				router.push('/admin/categories');
				router.refresh();
			} catch (err: any) {
				setServerError(err.message || 'No se pudo eliminar la categoría.');
			}
		});
	}

	function update<K extends keyof CategoryFormValues>(key: K, val: CategoryFormValues[K]) {
		setValues(s => ({ ...s, [key]: val }));
		if (errors[key as string]) setErrors(e=>{ const c={...e}; delete c[key as string]; return c; });
	}

	function autoSlug() {
		if (values.slug) return;
		update('slug', values.name.toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,''));
	}

	return (
		<form onSubmit={onSubmit} className="space-y-6" noValidate>
			<div className="space-y-1">
				<h1 className="text-xl font-semibold tracking-tight">{mode === 'edit' ? 'Editar categoría':'Nueva categoría'}</h1>
				<p className="text-sm text-neutral-500">Define cómo se mostrará y agrupará el catálogo.</p>
			</div>
			{serverError && <div className="px-3 py-2 text-sm rounded-md bg-red-100 text-red-700">{serverError}</div>}
			{serverSuccess && <div className="px-3 py-2 text-sm rounded-md bg-green-100 text-green-700">{serverSuccess}</div>}
			<div className="grid gap-6 md:grid-cols-2">
				<div className="space-y-5 md:col-span-1">
					<div className="space-y-2">
						<label className="text-sm font-medium text-neutral-700 flex items-center gap-2" htmlFor="name">Nombre <span className="text-red-500">*</span></label>
						<input id="name" value={values.name} onChange={e=>update('name', e.target.value)} onBlur={autoSlug} className={`w-full px-3 py-2 text-sm rounded-md border bg-white focus:outline-none focus:ring-2 ${errors.name? 'border-red-400 ring-red-200':'border-neutral-300 focus:ring-carrot/50'}`} placeholder="Accesorios"/>
						{errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
					</div>
					<div className="space-y-2">
						<label className="text-sm font-medium text-neutral-700" htmlFor="slug">Slug <span className="text-red-500">*</span></label>
						<input id="slug" value={values.slug} onChange={e=>update('slug', e.target.value)} className={`w-full px-3 py-2 text-sm rounded-md border bg-white font-mono tracking-tight focus:outline-none focus:ring-2 ${errors.slug? 'border-red-400 ring-red-200':'border-neutral-300 focus:ring-carrot/50'}`} placeholder="accesorios"/>
						{errors.slug && <p className="text-xs text-red-500">{errors.slug}</p>}
					</div>
					<div className="space-y-2">
						<label className="text-sm font-medium text-neutral-700">Imagen</label>
						<input type="file" accept="image/*" onChange={onFileChange} className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-carrot file:text-nav hover:file:bg-carrot-dark" />
						<p className="text-[11px] text-neutral-500">Sube una imagen cuadrada (1:1). Si no subes, se aplicará una imagen por defecto.</p>
						{(filePreview || values.imageUrl) && !removeImage && (
							<div className="relative mt-3 overflow-hidden border rounded-lg aspect-square w-full max-w-[220px] border-neutral-300 bg-neutral-50 group">
								{/* eslint-disable-next-line @next/next/no-img-element */}
								<img src={filePreview || values.imageUrl} alt="Previsualización" className="object-cover w-full h-full" />
								<button type="button" onClick={()=>{ resetImage(); if (values.imageUrl) update('imageUrl',''); if (mode==='edit') setRemoveImage(true); }} className="absolute top-2 right-2 px-2 py-1 text-xs font-medium transition rounded-md bg-neutral-900/70 text-white hover:bg-neutral-900">Quitar</button>
							</div>
						)}
						{mode==='edit' && !filePreview && !values.imageUrl && (
							<label className="flex items-center gap-2 text-xs text-neutral-600">
								<input type="checkbox" checked={removeImage} onChange={e=>setRemoveImage(e.target.checked)} className="w-4 h-4 rounded border-neutral-300 text-carrot focus:ring-carrot/50" />
								Eliminar imagen (usar fallback)
							</label>
						)}
						{removeImage && <p className="text-[11px] text-red-600">Se utilizará la imagen por defecto.</p>}
					</div>
				</div>
				<div className="space-y-5 md:col-span-1">
					<fieldset className="space-y-3">
						<legend className="text-sm font-medium text-neutral-700">Estado</legend>
						<label className="flex items-center gap-2 text-sm">
							<input type="checkbox" checked={values.active} onChange={e=>update('active', e.target.checked)} className="w-4 h-4 rounded border-neutral-300 text-carrot focus:ring-carrot/50"/>
							Activa (visible para clientes)
						</label>
					</fieldset>
					{values.imageUrl && (
						<div className="space-y-2">
							<p className="text-sm font-medium text-neutral-700">Previsualización</p>
							{/* eslint-disable-next-line @next/next/no-img-element */}
							<img src={values.imageUrl} alt="Preview" className="object-cover w-full h-40 rounded-md border border-neutral-200" onError={(e)=>{(e.target as HTMLImageElement).style.opacity='0.3';}} />
						</div>
					)}
				</div>
			</div>
			<div className="flex flex-wrap gap-3 pt-2">
				<button disabled={isPending || cannotEdit} className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-md bg-carrot text-nav hover:bg-carrot-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-carrot/60 disabled:opacity-60 disabled:cursor-not-allowed">
					{isPending && <i className='bx bx-loader-alt animate-spin text-base'/>}
					{values.id ? 'Guardar cambios':'Crear categoría'}
				</button>
				<button type="button" disabled={isPending} onClick={()=>router.push('/admin/categories')} className="px-5 py-2.5 text-sm font-medium transition rounded-md border border-neutral-300 bg-white hover:bg-neutral-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-carrot/50 disabled:opacity-50">Cancelar</button>
				{values.id && can('category:delete') && (
					<button type="button" disabled={isPending} onClick={onDelete} className="px-5 py-2.5 text-sm font-semibold text-white transition bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/60 disabled:opacity-60 disabled:cursor-not-allowed">
						{isPending ? 'Procesando…' : 'Eliminar categoría'}
					</button>
				)}
				{cannotEdit && <p className="w-full text-xs text-red-500">No tienes permiso para {values.id? 'actualizar':'crear'} categorías.</p>}
			</div>
		</form>
	);
}
