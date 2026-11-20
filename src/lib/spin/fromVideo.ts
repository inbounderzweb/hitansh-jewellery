/**
 * Turns a 360° turntable video into the frames of a spin, in the browser:
 * one frame every 360/count degrees, cut out of a white studio background
 * (so the ring sits on the site's navy), downscaled and encoded as WebP.
 *
 * The cut-out flood-fills "background" from the frame edge through light,
 * neutral pixels (white + soft grey shadow), also clears large enclosed white
 * areas (seen through the ring), un-mixes the white from edge pixels and
 * turns the grey floor shadow under the ring into a soft dark one.
 * Diamond sparkles are small and enclosed by metal, so they are kept.
 */

export type SpinProgress = { phase: 'frames'; done: number; total: number };

export type SpinResult = {
	frames: Blob[];
	/** What the video's background was; only `white` is cut out. */
	background: 'white' | 'dark' | 'other';
};

function cutOut(img: ImageData) {
	const { width: W, height: H, data: d } = img;
	const N = W * H;
	const bg = new Uint8Array(N);
	const q = new Int32Array(N);
	const lo = (i: number) => Math.min(d[i * 4], d[i * 4 + 1], d[i * 4 + 2]);
	const hi = (i: number) => Math.max(d[i * 4], d[i * 4 + 1], d[i * 4 + 2]);
	const loose = (i: number) => 255 - lo(i) < 40 && hi(i) - lo(i) < 22;
	const strict = (i: number) => 255 - lo(i) < 8 && hi(i) - lo(i) < 6;

	const flood = (
		seeds: number[],
		test: (i: number) => boolean,
		mark: Uint8Array,
	) => {
		let head = 0;
		let tail = 0;
		for (const s of seeds)
			if (!mark[s] && test(s)) {
				mark[s] = 1;
				q[tail++] = s;
			}
		while (head < tail) {
			const i = q[head++];
			const x = i % W;
			const next = [
				x > 0 ? i - 1 : -1,
				x < W - 1 ? i + 1 : -1,
				i - W,
				i + W,
			];
			for (const j of next)
				if (j >= 0 && j < N && !mark[j] && test(j)) {
					mark[j] = 1;
					q[tail++] = j;
				}
		}
		return tail;
	};

	const border: number[] = [];
	for (let x = 0; x < W; x++) border.push(x, (H - 1) * W + x);
	for (let y = 0; y < H; y++) border.push(y * W, y * W + W - 1);
	flood(border, loose, bg);

	const minHole = Math.round(N * 0.0018);
	const seen = new Uint8Array(N);
	for (let i = 0; i < N; i++) {
		if (bg[i] || seen[i] || !strict(i)) continue;
		const size = flood([i], (j) => !bg[j] && strict(j), seen);
		if (size >= minHole) flood([i], loose, bg);
	}

	const band = 2;
	for (let i = 0; i < N; i++) {
		const o = i * 4;
		if (bg[i]) {
			d[o + 3] = 0;
			continue;
		}
		const x = i % W;
		const y = (i / W) | 0;
		let near = false;
		for (let dy = -band; dy <= band && !near; dy++)
			for (let dx = -band; dx <= band; dx++) {
				const xx = x + dx;
				const yy = y + dy;
				if (xx >= 0 && yy >= 0 && xx < W && yy < H && bg[yy * W + xx]) {
					near = true;
					break;
				}
			}
		if (!near) continue;
		const a = Math.max(0.04, Math.min(1, (255 - lo(i)) / 140));
		for (let k = 0; k < 3; k++)
			d[o + k] = Math.max(
				0,
				Math.min(255, (d[o + k] - (1 - a) * 255) / a),
			);
		d[o + 3] = Math.round(a * 255);
	}

	// The studio floor's contact shadow under the ring is neutral grey: on
	// white it reads as shadow, on navy as a pale rim. Scanning each column up
	// from the bottom (the ring stands on metal), turn it into a soft dark one.
	const depth = Math.round(W * 0.016);
	for (let x = 0; x < W; x++) {
		let y = H - 1;
		while (y >= 0 && d[(y * W + x) * 4 + 3] === 0) y--;
		for (let k = 0; k < depth && y >= 0; k++, y--) {
			const o = (y * W + x) * 4;
			const r = d[o];
			const g = d[o + 1];
			const b = d[o + 2];
			if (Math.max(r, g, b) - Math.min(r, g, b) > 12) break; // the metal
			const lum = (r + g + b) / 3;
			d[o] = d[o + 1] = d[o + 2] = 0;
			d[o + 3] = Math.min(d[o + 3], Math.round((255 - lum) * 0.85));
		}
	}
	return img;
}

function classify(img: ImageData): SpinResult['background'] {
	const { width: W, height: H, data: d } = img;
	const points = [
		[2, 2],
		[W - 3, 2],
		[2, H - 3],
		[W - 3, H - 3],
	];
	const lums = points.map(([x, y]) => {
		const o = (y * W + x) * 4;
		return (d[o] + d[o + 1] + d[o + 2]) / 3;
	});
	if (lums.every((l) => l > 240)) return 'white';
	if (lums.every((l) => l < 30)) return 'dark';
	return 'other';
}

const toBlob = (canvas: HTMLCanvasElement) =>
	new Promise<Blob>((resolve, reject) =>
		canvas.toBlob(
			(b) =>
				b ? resolve(b) : reject(new Error('Could not encode a frame.')),
			'image/webp',
			0.82,
		),
	);

export async function framesFromVideo(
	file: File,
	{
		count = 72,
		size = 1000,
		onProgress,
	}: {
		count?: number;
		size?: number;
		onProgress?: (p: SpinProgress) => void;
	} = {},
): Promise<SpinResult> {
	const url = URL.createObjectURL(file);
	const video = document.createElement('video');
	video.muted = true;
	video.playsInline = true;
	video.preload = 'auto';
	video.src = url;
	try {
		await new Promise<void>((resolve, reject) => {
			video.addEventListener('loadeddata', () => resolve(), {
				once: true,
			});
			video.addEventListener(
				'error',
				() =>
					reject(
						new Error(
							'This video could not be read. Use an MP4 (H.264) file.',
						),
					),
				{ once: true },
			);
		});
		const vw = video.videoWidth;
		const vh = video.videoHeight;
		if (!vw || !vh || !Number.isFinite(video.duration))
			throw new Error('This video could not be read.');

		// Work on a centred square, at most 1600 px (cut-out cost grows with area).
		const side = Math.min(vw, vh);
		const work = Math.min(side, 1600);
		const big = document.createElement('canvas');
		big.width = work;
		big.height = work;
		const bctx = big.getContext('2d', { willReadFrequently: true })!;
		const out = document.createElement('canvas');
		out.width = Math.min(size, work);
		out.height = out.width;
		const octx = out.getContext('2d')!;
		octx.imageSmoothingQuality = 'high';

		const step = video.duration / count;
		const frames: Blob[] = [];
		let background: SpinResult['background'] = 'other';
		for (let i = 0; i < count; i++) {
			video.currentTime = Math.min(
				video.duration - 0.01,
				i * step + 0.001,
			);
			await new Promise<void>((resolve) =>
				video.addEventListener('seeked', () => resolve(), {
					once: true,
				}),
			);
			bctx.clearRect(0, 0, work, work);
			bctx.drawImage(
				video,
				(vw - side) / 2,
				(vh - side) / 2,
				side,
				side,
				0,
				0,
				work,
				work,
			);
			const pixels = bctx.getImageData(0, 0, work, work);
			if (i === 0) background = classify(pixels);
			if (background === 'white') bctx.putImageData(cutOut(pixels), 0, 0);
			octx.clearRect(0, 0, out.width, out.height);
			octx.drawImage(big, 0, 0, out.width, out.height);
			frames.push(await toBlob(out));
			onProgress?.({ phase: 'frames', done: i + 1, total: count });
		}
		return { frames, background };
	} finally {
		URL.revokeObjectURL(url);
		video.removeAttribute('src');
		video.load();
	}
}
