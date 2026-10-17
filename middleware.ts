import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

// Lightweight JWT verify (matches app auth). Returns payload or null.
async function verify(token: string) {
	try {
		const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'dev-secret-change-me');
		const { payload } = await jwtVerify(token, secret);
		return payload as any;
	} catch {
		return null;
	}
}

// NOTE: Prisma Client cannot run in middleware (Edge runtime). We only perform
// authentication here; fine‑grained permission checks happen in API routes and
// server components using requirePermission / getUserPermissions.

export async function middleware(req: NextRequest) {
	const { pathname } = req.nextUrl;
	const isApi = pathname.startsWith('/api/');
	// Static/public assets we want to serve with permissive CORS for external clients (Flutter Web)
	const isAsset =
		pathname.startsWith('/images') ||
		pathname.startsWith('/items') ||
		pathname.startsWith('/media') ||
		pathname === '/favicon.ico' ||
		pathname.startsWith('/_next/image') ||
		pathname.startsWith('/_next/static');
	const isProtected = pathname.startsWith('/admin') || pathname.startsWith('/api/admin');

	// ----- CORS Handling -----
	// Allow configuration via env CORS_ORIGINS=origin1,origin2
	const origin = req.headers.get('origin') || '';
		const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:3000,http://localhost:62606').split(',').map(o=>o.trim()).filter(Boolean);
		const originAllowed = allowedOrigins.includes(origin);
		const allowCredentials = (process.env.CORS_ALLOW_CREDENTIALS || 'true') !== 'false';

		// IMPORTANT: No usar '*' cuando enviamos credenciales.
		const corsHeaders: Record<string,string> = {
			'Access-Control-Allow-Origin': originAllowed ? origin : (allowCredentials ? '' : '*'),
			'Vary': 'Origin',
			'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
			'Access-Control-Allow-Headers': 'Content-Type,Authorization,Accept',
			'Access-Control-Max-Age': '86400'
		};
		if (allowCredentials && originAllowed) corsHeaders['Access-Control-Allow-Credentials'] = 'true';

		// Assets (public files, next static, image optimizer) should be world-readable.
		// Serve with '*' and without credentials regardless of allowedOrigins.
		const assetCorsHeaders: Record<string,string> = {
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'GET,OPTIONS',
			'Access-Control-Allow-Headers': 'Content-Type,Accept',
			'Access-Control-Max-Age': '86400'
		};

	// Preflight
	if ((isApi || isAsset) && req.method === 'OPTIONS') {
			// Para preflight, si origen no permitido devolvemos 403 temprano
			if (isApi && !originAllowed) {
				return new NextResponse(null, { status: 403, headers: { 'Access-Control-Allow-Origin': 'null' } });
			}
			const pre = new NextResponse(null, { status: 204 });
			const headersToUse = isAsset ? assetCorsHeaders : corsHeaders;
			Object.entries(headersToUse).forEach(([k,v])=>{ if(v) pre.headers.set(k,v); });
			return pre;
	}

	// If not protected, just pass through (but attach CORS for /api and assets)
	if (!isProtected) {
		const res = NextResponse.next();
			if (isApi) Object.entries(corsHeaders).forEach(([k,v])=>{ if (v) res.headers.set(k,v); });
			if (isAsset) Object.entries(assetCorsHeaders).forEach(([k,v])=>{ if (v) res.headers.set(k,v); });
		return res;
	}

	// ----- Auth for protected admin paths -----
	const token = req.cookies.get('session')?.value;
	if (!token) {
		if (pathname.startsWith('/api')) {
			const unauth = NextResponse.json({ error: 'Unauthenticated', code: 'UNAUTHENTICATED' }, { status: 401 });
			Object.entries(corsHeaders).forEach(([k,v])=>{ if (v) unauth.headers.set(k,v); });
			return unauth;
		}
		const loginUrl = new URL('/login', req.url);
		loginUrl.searchParams.set('from', pathname);
		return NextResponse.redirect(loginUrl);
	}
	const payload = await verify(token);
	const userId = payload?.sub;
	if (!userId) {
		if (pathname.startsWith('/api')) {
			const unauth = NextResponse.json({ error: 'Unauthenticated', code: 'UNAUTHENTICATED' }, { status: 401 });
			Object.entries(corsHeaders).forEach(([k,v])=>{ if (v) unauth.headers.set(k,v); });
			return unauth;
		}
		return NextResponse.redirect(new URL('/login', req.url));
	}

	const res = NextResponse.next();
	if (isApi) Object.entries(corsHeaders).forEach(([k,v])=>{ if (v) res.headers.set(k,v); });
	if (isAsset) Object.entries(assetCorsHeaders).forEach(([k,v])=>{ if (v) res.headers.set(k,v); });
	return res;
}

export const config = {
	matcher: [
		'/admin/:path*',
		'/api/:path*',
		// Static assets served from public/
		'/images/:path*',
		'/items/:path*',
		'/media/:path*',
		'/favicon.ico',
		// Next.js static + image optimizer
		'/_next/image',
		'/_next/static/:path*'
	]
};
