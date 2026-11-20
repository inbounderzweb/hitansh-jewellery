import type { ImageLoaderProps } from 'next/image';

/**
 * Cloudinary delivery helpers (browser-safe; no credentials involved).
 *
 * Cloudinary URLs are resized and optimised by Cloudinary itself:
 * `f_auto` picks AVIF/WebP per browser, `q_auto` tunes compression, and
 * `w_<n>` matches each entry of the responsive `srcset` next/image builds.
 */

const UPLOAD_SEGMENT = '/image/upload/';

export const isCloudinaryUrl = (url: string) =>
	url.startsWith('https://res.cloudinary.com/') &&
	url.includes(UPLOAD_SEGMENT);

export function cloudinaryUrl(
	url: string,
	{ width, quality }: { width?: number; quality?: number } = {},
) {
	if (!isCloudinaryUrl(url)) return url;
	const transforms = [
		'f_auto',
		quality ? `q_${quality}` : 'q_auto',
		'c_limit',
		...(width ? [`w_${width}`] : []),
	].join(',');
	const [base, rest] = url.split(UPLOAD_SEGMENT);
	return `${base}${UPLOAD_SEGMENT}${transforms}/${rest}`;
}

export const cloudinaryLoader = ({ src, width, quality }: ImageLoaderProps) =>
	cloudinaryUrl(src, { width, quality });
