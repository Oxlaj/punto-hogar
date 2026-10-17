import { NextResponse } from 'next/server';
import { prisma } from '../../../../../src/lib/prisma';
import { requireAdministrator, requirePermission, invalidatePermissions } from '../../../../../src/lib/permissions';
import { logAudit } from '../../../../../src/lib/audit';
import bcrypt from 'bcryptjs';

interface Params { params: { id: string } }

async function resolveRoleIds(body: any) {
	const values = Array.isArray(body.roleIds) ? body.roleIds : (Array.isArray(body.roles) ? body.roles : []);
	if (!values.length) return [];
	const identifiers = values.map((value: any) => String(value));
	const rows = await prisma.roleEntity.findMany({
		where: { OR: [{ id: { in: identifiers } }, { name: { in: identifiers } }] },
		select: { id: true }
	});
	return rows.map(role => role.id);
}

export async function GET(_: Request, { params }: Params) {
	try {
		await requireAdministrator();
		await requirePermission('user:read');
		const user = await prisma.user.findUnique({ where: { id: params.id } });
		if (!user) return NextResponse.json({ error: 'Not found', code: 'NOT_FOUND' }, { status: 404 });
		const roles = await prisma.userRole.findMany({ where: { userId: user.id }, include: { role: true } });
		return NextResponse.json({ id: user.id, email: user.email, name: user.name, roles: roles.map(r=> r.role.name), createdAt: user.createdAt });
	} catch (e: any) {
		if (e instanceof Error) {
			if (e.message === 'UNAUTHENTICATED') return NextResponse.json({ error: 'Unauthenticated', code: 'UNAUTHENTICATED' }, { status: 401 });
			if (e.message === 'FORBIDDEN') return NextResponse.json({ error: 'Forbidden', code: 'FORBIDDEN' }, { status: 403 });
		}
		return NextResponse.json({ error: 'Error', code: 'SERVER_ERROR' }, { status: 500 });
	}
}

export async function PUT(req: Request, { params }: Params) {
	try {
		const administrator = await requireAdministrator();
		await requirePermission('user:update');
		const body = await req.json();
		const email = typeof body.email === 'string' && body.email.trim() ? String(body.email).trim() : undefined;
		const name = body.name !== undefined ? (body.name ? String(body.name).trim() : null) : undefined;
		const hasRoles = Array.isArray(body.roleIds) || Array.isArray(body.roles);
		const roleIds = hasRoles ? await resolveRoleIds(body) : undefined;
		const password: string | undefined = typeof body.password === 'string' && body.password ? body.password : undefined;

		const data: any = {};
		if (email !== undefined) data.email = email;
		if (name !== undefined) data.name = name;
		if (password) data.passwordHash = await bcrypt.hash(password, 10);

		const target = await prisma.user.findUnique({ where: { id: params.id }, select: { id: true } });
		if (!target) return NextResponse.json({ error: 'Not found', code: 'NOT_FOUND' }, { status: 404 });
		if (roleIds && administrator.id === params.id) {
			const adminRoles = await prisma.roleEntity.findMany({
				where: { name: { in: ['admin', 'ADMIN', 'Administrador'] } },
				select: { id: true }
			});
			const retainsAdminRole = adminRoles.every(role => roleIds.includes(role.id));
			if (adminRoles.length > 0 && !retainsAdminRole) {
				return NextResponse.json({ error: 'No puedes quitarte tu propio acceso administrativo.', code: 'SELF_ADMIN_REVOKE' }, { status: 409 });
			}
		}
		const user = await prisma.user.update({ where: { id: params.id }, data });
		if (roleIds) {
			await prisma.userRole.deleteMany({ where: { userId: user.id } });
			if (roleIds.length) {
				await prisma.userRole.createMany({ data: roleIds.map(roleId=>({ userId: user.id, roleId })) });
			}
		}
		invalidatePermissions(user.id);
		logAudit('user.update','User', user.id, { email, name, roleIds: roleIds ?? 'KEEP' });
		const assigned = await prisma.userRole.findMany({ where: { userId: user.id }, include: { role: true } });
		return NextResponse.json({ id: user.id, email: user.email, name: user.name, roles: assigned.map(a=> a.role.name), createdAt: user.createdAt });
	} catch (e: any) {
		if (e instanceof Error) {
			if (e.message === 'UNAUTHENTICATED') return NextResponse.json({ error: 'Unauthenticated', code: 'UNAUTHENTICATED' }, { status: 401 });
			if (e.message === 'FORBIDDEN') return NextResponse.json({ error: 'Forbidden', code: 'FORBIDDEN' }, { status: 403 });
		}
		return NextResponse.json({ error: 'Error updating', code: 'SERVER_ERROR' }, { status: 500 });
	}
}

export async function DELETE(_: Request, { params }: Params) {
	try {
		const administrator = await requireAdministrator();
		await requirePermission('user:delete');
		if (administrator.id === params.id) {
			return NextResponse.json({ error: 'No puedes eliminar tu propio usuario administrador.', code: 'SELF_ADMIN_DELETE' }, { status: 409 });
		}
		const target = await prisma.user.findUnique({ where: { id: params.id }, select: { role: true } });
		if (!target) return NextResponse.json({ error: 'Not found', code: 'NOT_FOUND' }, { status: 404 });
		if (target.role === 'ADMIN') {
			const administrators = await prisma.user.count({ where: { role: 'ADMIN' } });
			if (administrators <= 1) {
				return NextResponse.json({ error: 'No puedes eliminar al último administrador del sistema.', code: 'LAST_ADMIN_DELETE' }, { status: 409 });
			}
		}
		await prisma.user.delete({ where: { id: params.id } });
		logAudit('user.delete','User', params.id);
		return NextResponse.json({ ok: true });
	} catch (e: any) {
		if (e instanceof Error) {
			if (e.message === 'UNAUTHENTICATED') return NextResponse.json({ error: 'Unauthenticated', code: 'UNAUTHENTICATED' }, { status: 401 });
			if (e.message === 'FORBIDDEN') return NextResponse.json({ error: 'Forbidden', code: 'FORBIDDEN' }, { status: 403 });
		}
		return NextResponse.json({ error: 'Error deleting', code: 'SERVER_ERROR' }, { status: 500 });
	}
}
