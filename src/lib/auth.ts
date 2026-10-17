import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';

const SESSION_COOKIE = 'session';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

function getJwtSecret() {
	const secret = process.env.JWT_SECRET || 'dev-secret-change-me';
	return new TextEncoder().encode(secret);
}

export async function hashPassword(password: string) {
	const salt = await bcrypt.genSalt(10);
	return bcrypt.hash(password, salt);
}

export async function verifyPassword(password: string, hash: string) {
	return bcrypt.compare(password, hash);
}

export type SessionPayload = { sub: string; email: string; role: 'USER' | 'ADMIN' };

export async function createSessionCookie(payload: SessionPayload) {
	const token = await new SignJWT(payload)
		.setProtectedHeader({ alg: 'HS256' })
		.setIssuedAt()
		.setExpirationTime(`${COOKIE_MAX_AGE}s`)
		.sign(getJwtSecret());
	cookies().set(SESSION_COOKIE, token, {
		httpOnly: true,
		sameSite: 'lax',
		secure: process.env.NODE_ENV === 'production',
		maxAge: COOKIE_MAX_AGE,
		path: '/',
	});
}

export function clearSessionCookie() {
	cookies().delete(SESSION_COOKIE);
}

export async function getSession(): Promise<SessionPayload | null> {
	const c = cookies().get(SESSION_COOKIE)?.value;
	if (!c) return null;
	try {
		const { payload } = await jwtVerify(c, getJwtSecret());
		return payload as any;
	} catch {
		return null;
	}
}
