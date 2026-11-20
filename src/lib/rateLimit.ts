import 'server-only';
import { headers } from 'next/headers';
import { collections } from '@/lib/db/mongo';

/**
 * Fixed-window rate limiting stored in MongoDB (works across serverless
 * instances). Expired windows are removed by a TTL index.
 */
export async function hit(
	key: string,
	limit: number,
	windowSeconds: number,
): Promise<{ allowed: boolean; count: number }> {
	const { rateLimits } = await collections();
	const now = new Date();
	// Start a fresh window if the stored one has expired (TTL cleanup is lazy).
	await rateLimits.deleteOne({ _id: key, expiresAt: { $lte: now } });
	const doc = await rateLimits.findOneAndUpdate(
		{ _id: key },
		{
			$inc: { count: 1 },
			$setOnInsert: {
				expiresAt: new Date(now.getTime() + windowSeconds * 1000),
			},
		},
		{ upsert: true, returnDocument: 'after' },
	);
	const count = doc?.count ?? 1;
	return { allowed: count <= limit, count };
}

export async function clear(key: string) {
	const { rateLimits } = await collections();
	await rateLimits.deleteOne({ _id: key });
}

/** Best-effort client IP (set by the hosting proxy, e.g. Vercel). */
export async function clientIp(): Promise<string> {
	const h = await headers();
	return (
		h.get('x-real-ip') ??
		h.get('x-forwarded-for')?.split(',')[0]?.trim() ??
		'unknown'
	);
}
