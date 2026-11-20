import 'server-only';
import { cache } from 'react';
import { createHash, randomBytes } from 'node:crypto';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { ObjectId } from 'mongodb';
import { collections, isDbConfigured } from '@/lib/db/mongo';

/**
 * Admin sessions. The browser holds a random 256-bit token in an httpOnly
 * cookie scoped to /admin; the database stores only its SHA-256 hash, so a
 * leaked database cannot be used to log in.
 */

export const SESSION_COOKIE = 'hitansh_admin';
const SESSION_DAYS = 7;

const hashToken = (token: string) =>
	createHash('sha256').update(token).digest('base64url');

export async function createSession(userId: ObjectId) {
	const token = randomBytes(32).toString('base64url');
	const now = new Date();
	const expiresAt = new Date(now.getTime() + SESSION_DAYS * 86_400_000);
	const { sessions } = await collections();
	await sessions.insertOne({
		_id: hashToken(token),
		userId,
		createdAt: now,
		expiresAt,
	});
	(await cookies()).set(SESSION_COOKIE, token, {
		httpOnly: true,
		secure: process.env.NODE_ENV === 'production',
		sameSite: 'lax',
		path: '/admin',
		expires: expiresAt,
	});
}

export type AdminSession = {
	userId: string;
	email: string;
	name: string;
};

/** The signed-in admin for this request, or null. Deduplicated per request. */
export const getSession = cache(async (): Promise<AdminSession | null> => {
	if (!isDbConfigured()) return null;
	const token = (await cookies()).get(SESSION_COOKIE)?.value;
	if (!token) return null;
	const { sessions, adminUsers } = await collections();
	const session = await sessions.findOne({
		_id: hashToken(token),
		expiresAt: { $gt: new Date() },
	});
	if (!session) return null;
	const user = await adminUsers.findOne(
		{ _id: session.userId },
		{ projection: { email: 1, name: 1 } },
	);
	if (!user) return null;
	return {
		userId: user._id.toHexString(),
		email: user.email,
		name: user.name,
	};
});

/**
 * Server-side authorisation for every admin page and Server Action. Proxy
 * only redirects visitors without a cookie; this is the actual check.
 */
export async function requireAdmin(): Promise<AdminSession> {
	const session = await getSession();
	if (!session) redirect('/admin/login');
	return session;
}

export async function destroySession() {
	const jar = await cookies();
	const token = jar.get(SESSION_COOKIE)?.value;
	if (token && isDbConfigured()) {
		const { sessions } = await collections();
		await sessions.deleteOne({ _id: hashToken(token) });
	}
	jar.delete({ name: SESSION_COOKIE, path: '/admin' });
}
