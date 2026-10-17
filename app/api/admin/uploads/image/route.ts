import { NextResponse } from 'next/server';
import { requirePermission } from '../../../../../src/lib/permissions';
import { saveUploadedFile, slugify } from '../../../../../src/lib/uploads';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    await requirePermission('product:create'); // o category:create; usamos este como mínimo
    const contentType = req.headers.get('content-type') || '';
    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json({ error: 'UNSUPPORTED_MEDIA_TYPE', code: 'UNSUPPORTED_MEDIA_TYPE' }, { status: 415 });
    }
    const form = await req.formData();
    const file = form.get('file');
    const kind = String(form.get('kind') || 'generic');
    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ error: 'FILE_REQUIRED', code: 'FILE_REQUIRED' }, { status: 400 });
    }
    const baseName = String(form.get('name') || file.name || 'upload');
    const safeBase = slugify(baseName);
    let dir = 'media/uploads';
    if (kind === 'product') dir = 'items';
    else if (kind === 'category') dir = 'media/categories';
    const saved = await saveUploadedFile(file, dir, safeBase);
    return NextResponse.json({ url: saved.relativePath });
  } catch (e: any) {
    if (e instanceof Error) {
      if (e.message === 'UNAUTHENTICATED') return NextResponse.json({ error: 'UNAUTHENTICATED', code: 'UNAUTHENTICATED' }, { status: 401 });
      if (e.message === 'FORBIDDEN') return NextResponse.json({ error: 'FORBIDDEN', code: 'FORBIDDEN' }, { status: 403 });
      if (e.message === 'FILE_TOO_LARGE' || e.message === 'INVALID_MIME' || e.message === 'INVALID_EXT') {
        return NextResponse.json({ error: e.message, code: e.message }, { status: 400 });
      }
    }
    return NextResponse.json({ error: 'SERVER_ERROR', code: 'SERVER_ERROR' }, { status: 500 });
  }
}
