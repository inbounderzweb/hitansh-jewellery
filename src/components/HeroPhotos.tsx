'use client';

import { useEffect, useRef } from 'react';
import type { HeroRingSlide } from '@/lib/ringController';
import CatalogueImage from '@/components/catalogue/CatalogueImage';
import { cloudinaryUrl, isCloudinaryUrl } from '@/lib/images';

const clamp = (v: number, min: number, max: number) =>
	Math.min(max, Math.max(min, v));
const smooth = (t: number) => t * t * (3 - 2 * t);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Same slide hand-over envelope as the 3D ring (see setupViewer). */
const ENTER = 0.16;
const EXIT = 0.84;
/** Spin frames are delivered at this width (they are square). */
const SPIN_SIZE = 1000;

const frameUrl = (url: string) =>
	isCloudinaryUrl(url) ? cloudinaryUrl(url, { width: SPIN_SIZE }) : url;

/** Loads a spin's frames: the first at once, the rest in the background. */
function loadFrames(urls: string[], onFirst: () => void) {
	const frames = urls.map(() => null as HTMLImageElement | null);
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
			img.src = frameUrl(urls[i]);
		});
	void (async () => {
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

type Spin = {
	canvas: HTMLCanvasElement;
	ctx: CanvasRenderingContext2D;
	/** Frame currently drawn (-1: redraw). */
	shown: number;
	/** Eased frame position. */
	pos: number;
	frames: (HTMLImageElement | null)[];
	cancel: () => void;
};

/** Nearest loaded frame to `i` (frames wrap around). */
function nearest(frames: (HTMLImageElement | null)[], i: number) {
	const n = frames.length;
	for (let d = 0; d < n; d++) {
		const a = frames[(((i + d) % n) + n) % n];
		if (a) return a;
		const b = frames[(((i - d) % n) + n) % n];
		if (b) return b;
	}
	return null;
}

/**
 * Photo and 360° spin slides of the hero banner, standing in for the 3D model:
 *  - photos: the ring's views, each holding then crossfading into the next;
 *  - spin:   frames of a full turn, played by the scroll position.
 * Runs from its own animation loop, so it also works where WebGL is
 * unavailable; the 3D canvas hides itself on these slides.
 */
export default function HeroPhotos({ slides }: { slides: HeroRingSlide[] }) {
	const root = useRef<HTMLDivElement>(null);
	const hasMedia = slides.some((s) => s.photos?.length || s.spin?.length);

	useEffect(() => {
		const el = root.current;
		const hero = document.querySelector<HTMLElement>('#view1');
		if (!el || !hero) return;

		const still = window.matchMedia('(prefers-reduced-motion: reduce)');
		const total = slides.length;
		const loaders: { cancel: () => void }[] = [];

		const slots = Array.from(
			el.querySelectorAll<HTMLElement>('[data-photo-slide]'),
		).map((slot) => {
			const index = Number(slot.dataset.photoSlide);
			const canvas = slot.querySelector<HTMLCanvasElement>('canvas');
			const spinUrls = slides[index]?.spin ?? [];
			let spin: Spin | null = null;
			if (canvas) {
				const state: Spin = {
					canvas,
					ctx: canvas.getContext('2d')!,
					shown: -1,
					pos: 0,
					frames: [],
					cancel: () => {},
				};
				const loader = loadFrames(spinUrls, () => (state.shown = -1));
				state.frames = loader.frames;
				state.cancel = loader.cancel;
				spin = state;
				loaders.push(state);
			}
			return {
				index,
				slot,
				group: slot.querySelector<HTMLElement>('.hero-photos__group')!,
				views: Array.from(
					slot.querySelectorAll<HTMLElement>('[data-photo-view]'),
				),
				dots: Array.from(
					slot.querySelectorAll<HTMLElement>('[data-dot]'),
				),
				spin,
			};
		});

		// Size spin canvases to their box (sharp on HiDPI, capped at the frames).
		const resize = () => {
			for (const s of slots) {
				if (!s.spin) continue;
				const box = s.spin.canvas.getBoundingClientRect();
				const px = Math.round(
					Math.min(
						SPIN_SIZE,
						box.width * Math.min(window.devicePixelRatio || 1, 2),
					),
				);
				if (px && s.spin.canvas.width !== px) {
					s.spin.canvas.width = px;
					s.spin.canvas.height = px;
					s.spin.shown = -1;
				}
			}
		};
		resize();
		window.addEventListener('resize', resize, { passive: true });

		// Only touch the DOM when a value actually changes.
		const cache = new WeakMap<HTMLElement, Record<string, string>>();
		const write = (node: HTMLElement, prop: string, value: string) => {
			const seen = cache.get(node) ?? {};
			if (seen[prop] === value) return;
			seen[prop] = value;
			cache.set(node, seen);
			node.style.setProperty(prop, value);
		};

		let frame = 0;
		let last = performance.now();
		const tick = (now: number) => {
			frame = requestAnimationFrame(tick);
			const dt = clamp((now - last) / 1000, 0.001, 0.064);
			last = now;
			const vh = window.innerHeight || 900;
			const scrollY = window.scrollY;
			const height = hero.offsetHeight;
			if (scrollY > height + vh) return; // well past the hero: idle
			const pin = Math.max(vh, height - vh);
			const progress = clamp(scrollY / pin, 0, 1);
			const scaled = progress * total;
			const active = Math.min(total - 1, Math.floor(scaled));
			const segT = clamp(scaled - active, 0, 1);
			// Dissolve as the hero unpins into the next section.
			const unpin =
				scrollY > pin
					? 1 - smooth(clamp((scrollY - pin) / (vh * 0.65), 0, 1))
					: 1;

			for (const { index, slot, group, views, dots, spin } of slots) {
				if (index !== active) {
					write(slot, 'opacity', '0');
					write(slot, 'visibility', 'hidden');
					continue;
				}
				let opacity = 1;
				let depth = 0; // <0 arriving from afar, >0 leaving past the viewer
				if (index > 0 && segT < ENTER) {
					const e = smooth(segT / ENTER);
					opacity = e;
					depth = -(1 - e);
				} else if (index < total - 1 && segT > EXIT) {
					const x = smooth((segT - EXIT) / (1 - EXIT));
					opacity = 1 - x;
					depth = x;
				}
				write(slot, 'visibility', 'visible');
				write(slot, 'opacity', (opacity * unpin).toFixed(3));

				const moving = !still.matches;
				if (spin) {
					// One full turn across the slide; the turn itself is the motion.
					const n = spin.frames.length;
					const target = clamp((segT - 0.04) / 0.92, 0, 1) * n;
					spin.pos =
						moving && Math.abs(target - spin.pos) < n / 2
							? lerp(spin.pos, target, 1 - Math.exp(-14 * dt))
							: target;
					const i = Math.round(spin.pos) % n;
					if (i !== spin.shown) {
						const img = nearest(spin.frames, i);
						if (img) {
							const { width, height } = spin.canvas;
							spin.ctx.clearRect(0, 0, width, height);
							spin.ctx.drawImage(img, 0, 0, width, height);
							spin.shown = spin.frames[i] ? i : -1;
						}
					}
					const scale = moving
						? lerp(0.97, 1.03, segT) * (1 + depth * 0.14)
						: 1;
					write(
						group,
						'transform',
						`translate3d(0, 0, 0) scale(${scale.toFixed(4)})`,
					);
					continue;
				}

				const scale = moving
					? lerp(0.94, 1.05, segT) * (1 + depth * 0.14)
					: 1;
				const turn = moving ? lerp(-3, 3, segT) : 0;
				const lift = moving ? lerp(1.5, -1.5, segT) : 0;
				write(
					group,
					'transform',
					`translate3d(0, ${lift.toFixed(2)}vh, 0) rotate(${turn.toFixed(2)}deg) scale(${scale.toFixed(4)})`,
				);

				// Views: each holds, then crossfades into the next.
				const n = views.length;
				const p = clamp((segT - 0.1) / 0.78, 0, 1) * Math.max(0, n - 1);
				const k = Math.min(n - 1, Math.floor(p));
				const w = smooth(clamp((p - k - 0.3) / 0.4, 0, 1));
				views.forEach((view, v) => {
					const o = v === k ? 1 - w : v === k + 1 ? w : 0;
					write(view, 'opacity', o.toFixed(3));
				});
				const current = w > 0.5 ? k + 1 : k;
				dots.forEach((dot, v) =>
					dot.classList.toggle('is-active', v === current),
				);
			}
		};
		frame = requestAnimationFrame(tick);
		return () => {
			cancelAnimationFrame(frame);
			window.removeEventListener('resize', resize);
			loaders.forEach((l) => l.cancel());
		};
	}, [slides]);

	if (!hasMedia) return null;

	return (
		<div className="hero-photos" ref={root} aria-hidden>
			{slides.map((slide, i) => {
				if (slide.spin?.length)
					return (
						<div
							key={slide.id}
							className="hero-photos__slot"
							data-photo-slide={i}
							style={{ opacity: i === 0 ? 1 : 0 }}
						>
							<div className="hero-photos__group hero-photos__group--spin">
								<canvas className="hero-photos__canvas" />
							</div>
						</div>
					);
				if (!slide.photos?.length) return null;
				return (
					<div
						key={slide.id}
						className="hero-photos__slot"
						data-photo-slide={i}
						style={{ opacity: i === 0 ? 1 : 0 }}
					>
						<div className="hero-photos__group">
							{slide.photos.map((photo, v) => (
								<div
									key={`${photo.url}-${v}`}
									className="hero-photos__view"
									data-photo-view={v}
									style={{ opacity: v === 0 ? 1 : 0 }}
								>
									<CatalogueImage
										src={photo.url}
										alt=""
										fill
										sizes="(max-width: 768px) 92vw, min(78vh, 60vw)"
										loading={i === 0 ? 'eager' : 'lazy'}
										fetchPriority={
											i === 0 && v === 0
												? 'high'
												: undefined
										}
										className="hero-photos__img"
									/>
								</div>
							))}
						</div>
						{slide.photos.length > 1 && (
							<div className="hero-photos__dots">
								{slide.photos.map((photo, v) => (
									<span
										key={`${photo.url}-${v}`}
										data-dot
										className={v === 0 ? 'is-active' : ''}
									/>
								))}
							</div>
						)}
					</div>
				);
			})}
		</div>
	);
}
