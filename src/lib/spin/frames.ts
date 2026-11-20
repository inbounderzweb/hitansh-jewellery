/**
 * Loading and picking the frames of a 360° spin (a list of image URLs, one
 * per angle) for canvas playback. Shared by the hero banner and the
 * "Making" section.
 */
import { cloudinaryUrl, isCloudinaryUrl } from '@/lib/images';

/** Spin frames are delivered at this width (they are square). */
export const SPIN_SIZE = 1000;

export const spinFrameUrl = (url: string, width = SPIN_SIZE) =>
	isCloudinaryUrl(url) ? cloudinaryUrl(url, { width }) : url;

export type SpinFrames = (HTMLImageElement | null)[];

/** Loads a spin's frames: the first at once, the rest in the background. */
export function loadSpinFrames(
	urls: string[],
	onFirst: () => void,
	width = SPIN_SIZE,
) {
	const frames: SpinFrames = urls.map(() => null);
	let cancelled = false;
	const load = (i: number) =>
		new Promise<void>((resolve) => {
			const img = new Image();
			img.decoding = 'async';
			img.onload = () => {
				if (!cancelled) frames[i] = img;
				resolve();
			};
			img.onerror = () => resolve();
			img.src = spinFrameUrl(urls[i], width);
		});
	void (async () => {
		if (!urls.length) return;
		await load(0);
		if (cancelled) return;
		onFirst();
		// Coarse pass first (every 8th frame), then fill in — the ring can
		// turn early with a rougher step while the rest arrive.
		const order = [
			...urls.map((_, i) => i).filter((i) => i % 8 === 0 && i),
			...urls.map((_, i) => i).filter((i) => i % 8 !== 0),
		];
		for (let k = 0; k < order.length && !cancelled; k += 6)
			await Promise.all(order.slice(k, k + 6).map(load));
	})();
	return { frames, cancel: () => (cancelled = true) };
}

/** Nearest loaded frame to `i` (frames wrap around). */
export function nearestFrame(frames: SpinFrames, i: number) {
	const n = frames.length;
	for (let d = 0; d < n; d++) {
		const a = frames[(((i + d) % n) + n) % n];
		if (a) return a;
		const b = frames[(((i - d) % n) + n) % n];
		if (b) return b;
	}
	return null;
}
