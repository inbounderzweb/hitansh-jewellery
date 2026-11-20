import 'server-only';
import { createHash } from 'node:crypto';
import type { ImageAsset } from '@/lib/catalogue';

/**
 * Cloudinary, server side only. Credentials come from the environment:
 *
 *   CLOUDINARY_CLOUD_NAME   CLOUDINARY_API_KEY   CLOUDINARY_API_SECRET
 *   CLOUDINARY_FOLDER       (optional, default "hitansh")
 *
 * Uploads are *signed*: the admin's browser asks the server (an
 * authenticated Server Action) for a short-lived signature, then sends the
 * file straight to Cloudinary. The API secret never reaches the browser,
 * and the signature pins the folder and allowed formats.
 */

export const ALLOWED_FORMATS = 'jpg,jpeg,png,webp,avif';

function config() {
	const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
	const apiKey = process.env.CLOUDINARY_API_KEY;
	const apiSecret = process.env.CLOUDINARY_API_SECRET;
	if (!cloudName || !apiKey || !apiSecret) return null;
	return {
		cloudName,
		apiKey,
		apiSecret,
		folder: (process.env.CLOUDINARY_FOLDER || 'hitansh').replace(
			/^\/+|\/+$/g,
			'',
		),
	};
}

export const isCloudinaryConfigured = () => config() !== null;

/** Cloudinary request signature: sorted `k=v` pairs + secret, SHA-1. */
export function signParams(
	params: Record<string, string | number>,
	apiSecret: string,
) {
	const payload = Object.keys(params)
		.filter((k) => params[k] !== '' && params[k] !== undefined)
		.sort()
		.map((k) => `${k}=${params[k]}`)
		.join('&');
	return createHash('sha1')
		.update(payload + apiSecret)
		.digest('hex');
}

export type UploadSignature = {
	cloudName: string;
	apiKey: string;
	timestamp: number;
	folder: string;
	allowedFormats: string;
	signature: string;
};

export const UPLOAD_KINDS = ['products', 'collections', 'banner'] as const;
export type UploadKind = (typeof UPLOAD_KINDS)[number];

/** `kind` keeps each kind of image in its own sub-folder. */
export function createUploadSignature(
	kind: UploadKind,
): UploadSignature | null {
	const c = config();
	if (!c) return null;
	const timestamp = Math.floor(Date.now() / 1000);
	const folder = `${c.folder}/${kind}`;
	const params = { allowed_formats: ALLOWED_FORMATS, folder, timestamp };
	return {
		cloudName: c.cloudName,
		apiKey: c.apiKey,
		timestamp,
		folder,
		allowedFormats: ALLOWED_FORMATS,
		signature: signParams(params, c.apiSecret),
	};
}

/**
 * Accept an image reference sent by the admin form only if it is either a
 * Cloudinary upload in our own folder, or an image bundled with the site.
 */
export function sanitiseImage(input: unknown): ImageAsset | null {
	if (!input || typeof input !== 'object') return null;
	const img = input as Record<string, unknown>;
	const url = typeof img.url === 'string' ? img.url : '';
	const alt =
		typeof img.alt === 'string' ? img.alt.trim().slice(0, 300) : undefined;
	const width = Number.isInteger(img.width)
		? (img.width as number)
		: undefined;
	const height = Number.isInteger(img.height)
		? (img.height as number)
		: undefined;

	if (/^\/images\/[\w./-]+$/.test(url) && !url.includes('..')) {
		return { url, ...(alt && { alt }) };
	}

	const c = config();
	const publicId = typeof img.publicId === 'string' ? img.publicId : '';
	if (
		c &&
		publicId.startsWith(`${c.folder}/`) &&
		/^[\w/-]+$/.test(publicId) &&
		url.startsWith(
			`https://res.cloudinary.com/${c.cloudName}/image/upload/`,
		) &&
		url.includes(`/${publicId}.`)
	) {
		return {
			url,
			publicId,
			...(width && { width }),
			...(height && { height }),
			...(alt && { alt }),
		};
	}
	return null;
}

/** Permanently delete uploaded images. Failures are logged, not thrown. */
export async function destroyImages(publicIds: string[]) {
	const c = config();
	if (!c) return;
	await Promise.all(
		[...new Set(publicIds)]
			.filter((id) => id.startsWith(`${c.folder}/`))
			.map(async (publicId) => {
				const timestamp = Math.floor(Date.now() / 1000);
				const body = new URLSearchParams({
					public_id: publicId,
					timestamp: String(timestamp),
					invalidate: 'true',
					api_key: c.apiKey,
					signature: signParams(
						{ invalidate: 'true', public_id: publicId, timestamp },
						c.apiSecret,
					),
				});
				try {
					const res = await fetch(
						`https://api.cloudinary.com/v1_1/${c.cloudName}/image/destroy`,
						{
							method: 'POST',
							body,
							signal: AbortSignal.timeout(10_000),
						},
					);
					const data = (await res.json().catch(() => ({}))) as {
						result?: string;
					};
					if (
						!res.ok ||
						(data.result !== 'ok' && data.result !== 'not found')
					)
						console.error(
							'Cloudinary destroy failed',
							publicId,
							res.status,
							data,
						);
				} catch (error) {
					console.error('Cloudinary destroy failed', publicId, error);
				}
			}),
	);
}
