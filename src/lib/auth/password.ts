/**
 * Password hashing with Node's built-in scrypt (memory-hard, salted).
 * Stored format: `scrypt$N$r$p$<salt b64url>$<hash b64url>`.
 *
 * Kept free of Next.js / alias imports so `scripts/create-admin.mjs` can
 * import it directly.
 */
import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';

const N = 16384;
const R = 8;
const P = 1;
const KEY_LENGTH = 64;
const MAX_MEM = 64 * 1024 * 1024;

export const PASSWORD_MIN_LENGTH = 12;

function derive(
	password: string,
	salt: Buffer,
	n: number,
	r: number,
	p: number,
): Promise<Buffer> {
	return new Promise((resolve, reject) =>
		scrypt(
			password.normalize('NFKC'),
			salt,
			KEY_LENGTH,
			{ N: n, r, p, maxmem: MAX_MEM },
			(error, key) => (error ? reject(error) : resolve(key)),
		),
	);
}

export async function hashPassword(password: string): Promise<string> {
	const salt = randomBytes(16);
	const hash = await derive(password, salt, N, R, P);
	return [
		'scrypt',
		N,
		R,
		P,
		salt.toString('base64url'),
		hash.toString('base64url'),
	].join('$');
}

export async function verifyPassword(
	password: string,
	stored: string,
): Promise<boolean> {
	const [scheme, n, r, p, salt, hash] = stored.split('$');
	if (scheme !== 'scrypt' || !salt || !hash) return false;
	const expected = Buffer.from(hash, 'base64url');
	const actual = await derive(
		password,
		Buffer.from(salt, 'base64url'),
		Number(n),
		Number(r),
		Number(p),
	);
	return (
		actual.length === expected.length && timingSafeEqual(actual, expected)
	);
}

/** A valid hash to compare against when the account doesn't exist. */
export const DUMMY_HASH =
	'scrypt$16384$8$1$AAAAAAAAAAAAAAAAAAAAAA$' + 'A'.repeat(86);
