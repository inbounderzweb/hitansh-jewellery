'use server';

import { redirect } from 'next/navigation';
import { collections, isDbConfigured } from '@/lib/db/mongo';
import { DUMMY_HASH, verifyPassword } from '@/lib/auth/password';
import { createSession, destroySession } from '@/lib/auth/session';
import { clear, clientIp, hit } from '@/lib/rateLimit';

export type LoginState = { error?: string; email?: string };

const GENERIC = 'Incorrect email or password.';

/** Only same-site admin paths are allowed as the post-login destination. */
const safeNext = (value: FormDataEntryValue | null) => {
	const next = typeof value === 'string' ? value : '';
	return /^\/admin(\/[\w\-/?=&%.]*)?$/.test(next) &&
		!next.startsWith('/admin/login')
		? next
		: '/admin';
};

export async function login(
	_prev: LoginState,
	formData: FormData,
): Promise<LoginState> {
	if (!isDbConfigured())
		return { error: 'The database is not configured (MONGODB_URI).' };

	const email = String(formData.get('email') ?? '')
		.trim()
		.toLowerCase()
		.slice(0, 254);
	const password = String(formData.get('password') ?? '').slice(0, 512);
	if (!email || !password)
		return { error: 'Enter your email and password.', email };

	const ip = await clientIp();
	const [byEmail, byIp] = await Promise.all([
		hit(`login:email:${email}`, 5, 15 * 60),
		hit(`login:ip:${ip}`, 25, 15 * 60),
	]);
	if (!byEmail.allowed || !byIp.allowed)
		return {
			error: 'Too many sign-in attempts. Please wait 15 minutes and try again.',
			email,
		};

	const { adminUsers } = await collections();
	const user = await adminUsers.findOne({ email });
	// Always run the hash so response time doesn't reveal which emails exist.
	const ok = await verifyPassword(password, user?.passwordHash ?? DUMMY_HASH);
	if (!user || !ok) return { error: GENERIC, email };

	await Promise.all([
		clear(`login:email:${email}`),
		adminUsers.updateOne(
			{ _id: user._id },
			{ $set: { lastLoginAt: new Date() } },
		),
		createSession(user._id),
	]);
	redirect(safeNext(formData.get('next')));
}

export async function logout() {
	await destroySession();
	redirect('/admin/login');
}
