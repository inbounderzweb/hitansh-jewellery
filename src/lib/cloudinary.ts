import 'server-only';
import { createHash } from 'node:crypto';
import type { ImageAsset } from '@/lib/catalogue';
import type { ModelAsset } from '@/lib/db/types';

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

export const UPLOAD_KINDS = [
	'products',
	'collections',
	'banner',
	'hero',
] as const;
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

/* ------------------------------------------------------------ 3D models */

export type ModelUploadSignature = {
	cloudName: string;
	apiKey: string;
	timestamp: number;
	folder: string;
	signature: string;
};

/** Sub-folder for GLB models (uploaded as Cloudinary "raw" files). */
const MODELS = 'models';

/** Signature for uploading one GLB model as a raw file. */
export function createModelUploadSignature(): ModelUploadSignature | null {
	const c = config();
	if (!c) return null;
	const timestamp = Math.floor(Date.now() / 1000);
	const folder = `${c.folder}/${MODELS}`;
	return {
		cloudName: c.cloudName,
		apiKey: c.apiKey,
		timestamp,
		folder,
		signature: signParams({ folder, timestamp }, c.apiSecret),
	};
}

/** Raw files (models) are stored under this sub-folder only. */
export const isModelPublicId = (publicId: string) =>
	publicId.includes(`/${MODELS}/`);

/**
 * Accept a model reference sent by the admin form only if it is a GLB
 * uploaded to our own Cloudinary models folder.
 */
export function sanitiseModel(input: unknown): ModelAsset | null {
	if (!input || typeof input !== 'object') return null;
	const m = input as Record<string, unknown>;
	const c = config();
	const url = typeof m.url === 'string' ? m.url : '';
	const publicId = typeof m.publicId === 'string' ? m.publicId : '';
	if (
		!c ||
		!publicId.startsWith(`${c.folder}/${MODELS}/`) ||
		!/^[\w/.-]+$/.test(publicId) ||
		publicId.includes('..') ||
		!url.startsWith(
			`https://res.cloudinary.com/${c.cloudName}/raw/upload/`,
		) ||
		!url.endsWith(`/${publicId}`) ||
		!/\.glb$/i.test(url)
	)
		return null;
	const name =
		typeof m.name === 'string' ? m.name.trim().slice(0, 120) : undefined;
	const bytes = Number.isInteger(m.bytes) ? (m.bytes as number) : undefined;
	return {
		url,
		publicId,
		...(name && { name }),
		...(bytes && { bytes }),
	};
}

/* -------------------------------------------------------- Media library */

export type UploadedFile = {
	publicId: string;
	/** `image`: photos and spin frames; `raw`: GLB models. */
	resourceType: 'image' | 'raw';
	url: string;
	format?: string;
	bytes: number;
	width?: number;
	height?: number;
	createdAt: string;
};

/** Pages of 500 per type: enough for a large catalogue. */
const LIST_PAGES = 20;

/**
 * Every file uploaded to our Cloudinary folder (Admin API, server side —
 * the secret never leaves the server). `null` when Cloudinary isn't set up.
 */
export async function listUploads(): Promise<UploadedFile[] | null> {
	const c = config();
	if (!c) return null;
	const auth = Buffer.from(`${c.apiKey}:${c.apiSecret}`).toString('base64');
	const list = async (resourceType: 'image' | 'raw') => {
		const files: UploadedFile[] = [];
		let cursor = '';
		for (let page = 0; page < LIST_PAGES; page++) {
			const query = new URLSearchParams({
				prefix: `${c.folder}/`,
				max_results: '500',
				...(cursor && { next_cursor: cursor }),
			});
			const res = await fetch(
				`https://api.cloudinary.com/v1_1/${c.cloudName}/resources/${resourceType}/upload?${query}`,
				{
					headers: { Authorization: `Basic ${auth}` },
					cache: 'no-store',
					signal: AbortSignal.timeout(15_000),
				},
			);
			const data = (await res.json().catch(() => ({}))) as {
				resources?: {
					public_id: string;
					secure_url: string;
					format?: string;
					bytes?: number;
					width?: number;
					height?: number;
					created_at: string;
				}[];
				next_cursor?: string;
				error?: { message?: string };
			};
			if (!res.ok)
				throw new Error(
					`Cloudinary listing failed (${res.status}): ${data.error?.message ?? ''}`,
				);
			for (const r of data.resources ?? [])
				files.push({
					publicId: r.public_id,
					resourceType,
					url: r.secure_url,
					...(r.format && { format: r.format }),
					bytes: r.bytes ?? 0,
					...(r.width && { width: r.width }),
					...(r.height && { height: r.height }),
					createdAt: r.created_at,
				});
			cursor = data.next_cursor ?? '';
			if (!cursor) break;
		}
		return files;
	};
	const [images, raw] = await Promise.all([list('image'), list('raw')]);
	return [...images, ...raw];
}

/** Our own folder prefix, to check IDs sent by the admin. */
export const isOwnPublicId = (publicId: string) => {
	const c = config();
	return (
		!!c &&
		publicId.startsWith(`${c.folder}/`) &&
		/^[\w/.-]+$/.test(publicId) &&
		!publicId.includes('..')
	);
};

/** Cloudinary rejects many concurrent deletes (HTTP 420), so go a few at a time. */
const DESTROY_CONCURRENCY = 5;

/**
 * Permanently delete uploaded images (or, with `raw`, models). Failures are
 * logged, not thrown.
 */
export async function destroyImages(
	publicIds: string[],
	resourceType: 'image' | 'raw' = 'image',
) {
	const c = config();
	if (!c) return;
	const queue = [...new Set(publicIds)].filter((id) =>
		id.startsWith(`${c.folder}/`),
	);

	const destroy = async (publicId: string) => {
		for (let attempt = 0; attempt < 4; attempt++) {
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
					`https://api.cloudinary.com/v1_1/${c.cloudName}/${resourceType}/destroy`,
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
					res.ok &&
					(data.result === 'ok' || data.result === 'not found')
				)
					return;
				if (
					res.status === 420 ||
					res.status === 429 ||
					res.status >= 500
				) {
					await new Promise((r) => setTimeout(r, 500 * 2 ** attempt));
					continue;
				}
				console.error(
					'Cloudinary destroy failed',
					publicId,
					res.status,
					data,
				);
				return;
			} catch (error) {
				if (attempt === 3)
					console.error('Cloudinary destroy failed', publicId, error);
			}
		}
		console.error('Cloudinary destroy gave up after retries', publicId);
	};

	await Promise.all(
		Array.from(
			{ length: Math.min(DESTROY_CONCURRENCY, queue.length) },
			async () => {
				for (let id = queue.shift(); id; id = queue.shift())
					await destroy(id);
			},
		),
	);
}
