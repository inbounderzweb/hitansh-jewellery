'use client';

import { useEffect, useRef } from 'react';
import { splitAccent, type MakingContent } from '@/lib/making';
import { loadSpinFrames, nearestFrame } from '@/lib/spin/frames';

const clamp = (v: number, min = 0, max = 1) => Math.min(max, Math.max(min, v));
const smooth = (t: number) => t * t * (3 - 2 * t);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
/** 0→1 as `p` goes from `a` to `b`, eased. */
const span = (p: number, a: number, b: number) =>
	smooth(clamp((p - a) / (b - a)));

/** The four rings are smaller, so a lighter frame size is enough. */
const FRAME_WIDTH = 800;
/** Full turns the ring makes across the section. */
const TURNS = 1.25;

/**
 * Sticky "Making" section (`#making`): one ring lies centre stage, turning
 * as the visitor scrolls; it then separates into four rings in a row, one per
 * stage of the atelier's craft, whose labels appear one by one.
 *
 * Managed in Admin → Making section; by default it uses the 360° spin
 * frames of the first spin slide of the hero banner
 * (Admin → 3D banner), so it always shows the client's own ring.
 */
export default function RingAtelier({
	eyebrow,
	heading,
	stages,
	frames: urls,
}: MakingContent) {
	const sectionRef = useRef<HTMLElement>(null);
	const key = urls.join('|');

	useEffect(() => {
		const section = sectionRef.current;
		if (!section || !urls.length) return;
		const still = window.matchMedia('(prefers-reduced-motion: reduce)');
		const q = <T extends Element>(s: string) =>
			Array.from(section.querySelectorAll<T>(s));

		const hero = section.querySelector<HTMLElement>('[data-atelier-hero]')!;
		const heroCanvas = hero.querySelector('canvas')!;
		const heading = section.querySelector<HTMLElement>(
			'[data-atelier-heading]',
		)!;
		const stage = section.querySelector<HTMLElement>(
			'[data-atelier-stage]',
		)!;
		const rings = q<HTMLElement>('[data-atelier-ring]').map((el) => ({
			el,
			canvas: el.querySelector('canvas')!,
			label: el.querySelector<HTMLElement>('[data-atelier-label]')!,
			dx: 0,
			dy: 0,
		}));
		const canvases = [heroCanvas, ...rings.map((r) => r.canvas)].map(
			(canvas) => ({ canvas, ctx: canvas.getContext('2d')!, shown: -1 }),
		);

		const loader = loadSpinFrames(
			urls,
			() => canvases.forEach((c) => (c.shown = -1)),
			FRAME_WIDTH,
		);
		const n = urls.length;

		// Canvas resolution and each ring's offset from the stage centre
		// (offsetLeft/Top ignore transforms, so this is the resting layout).
		const measure = () => {
			const dpr = Math.min(window.devicePixelRatio || 1, 2);
			for (const c of canvases) {
				const px = Math.round(
					Math.min(FRAME_WIDTH, c.canvas.clientWidth * dpr),
				);
				if (px && c.canvas.width !== px) {
					c.canvas.width = px;
					c.canvas.height = px;
					c.shown = -1;
				}
			}
			const cx = stage.clientWidth / 2;
			const cy = stage.clientHeight / 2;
			for (const r of rings) {
				r.dx = cx - (r.el.offsetLeft + r.el.offsetWidth / 2);
				r.dy = cy - (r.el.offsetTop + r.el.offsetHeight / 2);
			}
		};
		measure();
		const observer = new ResizeObserver(measure);
		observer.observe(stage);

		const draw = (c: (typeof canvases)[number], pos: number) => {
			const i = ((Math.round(pos) % n) + n) % n;
			if (i === c.shown) return;
			const img = nearestFrame(loader.frames, i);
			if (!img) return;
			const { width, height } = c.canvas;
			c.ctx.clearRect(0, 0, width, height);
			c.ctx.drawImage(img, 0, 0, width, height);
			c.shown = loader.frames[i] ? i : -1;
		};

		let frame = 0;
		let turn = 0;
		let last = performance.now();
		const tick = (now: number) => {
			frame = requestAnimationFrame(tick);
			const dt = clamp((now - last) / 1000, 0.001, 0.064);
			last = now;
			const rect = section.getBoundingClientRect();
			const vh = window.innerHeight || 900;
			if (rect.bottom < -vh || rect.top > vh * 2) return; // off screen
			const moving = !still.matches;
			const p = moving
				? clamp(-rect.top / Math.max(1, rect.height - vh))
				: 1;

			// The turn eases towards the scroll position for a weighty feel.
			const target = p * TURNS * n;
			turn = moving ? lerp(turn, target, 1 - Math.exp(-10 * dt)) : 0;

			// Act 1: the single ring, sinking back as the four take over.
			const out = span(p, 0.24, 0.38);
			hero.style.opacity = (1 - out).toFixed(3);
			hero.style.visibility = out >= 1 ? 'hidden' : 'visible';
			hero.style.transform = `translate(-50%, -50%) translateY(${lerp(4, 0, span(p, 0, 0.3)).toFixed(2)}vh) scale(${lerp(1, 0.5, out).toFixed(4)})`;
			if (out < 1) draw(canvases[0], turn);

			// The heading rises in with the four rings.
			const h = span(p, 0.2, 0.36);
			heading.style.opacity = h.toFixed(3);
			heading.style.transform = `translateY(${lerp(28, 0, h).toFixed(1)}px)`;

			// Act 2: the four rings fan out from the centre; Act 3: labels.
			rings.forEach((r, k) => {
				const e = span(p, 0.27 + k * 0.025, 0.45 + k * 0.025);
				r.el.style.opacity = e.toFixed(3);
				r.el.style.transform = `translate3d(${(r.dx * (1 - e)).toFixed(1)}px, ${(r.dy * (1 - e)).toFixed(1)}px, 0) scale(${lerp(0.55, 1, e).toFixed(4)})`;
				const l = span(p, 0.5 + k * 0.09, 0.6 + k * 0.09);
				r.label.style.opacity = l.toFixed(3);
				r.label.style.transform = `translateY(${lerp(14, 0, l).toFixed(1)}px)`;
				// Each ring shows the piece from a different side.
				if (e > 0) draw(canvases[k + 1], turn + (k * n) / 4);
			});
		};
		frame = requestAnimationFrame(tick);

		return () => {
			cancelAnimationFrame(frame);
			observer.disconnect();
			loader.cancel();
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps -- keyed by the frame URLs
	}, [key]);

	if (!urls.length) return null;

	return (
		<section
			ref={sectionRef}
			id="making"
			className="atelier"
			aria-labelledby="atelier-title"
		>
			<div className="atelier__sticky">
				<div className="atelier__heading" data-atelier-heading>
					<p className="eyebrow">{eyebrow}</p>
					<h2 id="atelier-title" className="display atelier__title">
						{splitAccent(heading).map((part, i) =>
							part.accent ? (
								<em key={i}>{part.text}</em>
							) : (
								<span key={i}>{part.text}</span>
							),
						)}
					</h2>
				</div>

				<div className="atelier__stage" data-atelier-stage>
					<div
						className="atelier__hero"
						data-atelier-hero
						aria-hidden
					>
						<canvas className="atelier__canvas" />
						<span className="atelier__floor" />
					</div>
					<ol className="atelier__rings">
						{stages.map((title, i) => (
							<li
								key={i}
								className="atelier-ring"
								data-atelier-ring
							>
								<span
									className="atelier-ring__visual"
									aria-hidden
								>
									<canvas className="atelier__canvas" />
									<span className="atelier__floor" />
								</span>
								<span
									className="atelier-ring__label"
									data-atelier-label
								>
									<span
										className="atelier-ring__tick"
										aria-hidden
									/>
									<span className="atelier-ring__number">
										{String(i + 1).padStart(2, '0')}
									</span>
									<span className="atelier-ring__title">
										{title}
									</span>
								</span>
							</li>
						))}
					</ol>
				</div>
			</div>
		</section>
	);
}
