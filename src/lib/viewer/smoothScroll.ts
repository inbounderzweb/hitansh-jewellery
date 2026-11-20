import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

/**
 * Inertia-based smooth scrolling (Lenis), synchronised with GSAP ScrollTrigger.
 *
 * - Settings match the reference experience (duration 2.2s, soft exponential
 *   ease-out) so the scroll-scrubbed camera glides instead of stepping.
 * - Lenis is driven by GSAP's ticker, so the scroll position, ScrollTrigger and
 *   all tweens update in the same animation frame (no one-frame lag/jitter).
 * - Touch devices keep native momentum scrolling (Lenis `syncTouch` is off).
 * - Users with `prefers-reduced-motion: reduce` get native, non-smoothed
 *   scrolling (Lenis `respectReducedMotion`, on by default).
 * - Wheel/touch gestures inside the customizer UI and over the 3D canvas are
 *   left to the browser / OrbitControls (the swatch strip scrolls sideways and
 *   the ring can be orbited/zoomed while Lenis is stopped).
 *
 * The instance starts **stopped**; the caller starts it once the intro is done.
 */
let instance: Lenis | null = null;

/** The page's Lenis instance, or null before the 3D experience has booted. */
export function getLenis(): Lenis | null {
	return instance;
}

export function createSmoothScroll(): Lenis {
	const lenis = new Lenis({
		duration: 2.2,
		easing: (t) => Math.min(1, 1.001 - Math.pow(2, -5 * t)),
		smoothWheel: true,
		wheelMultiplier: 1,
		touchMultiplier: 1,
		// In-page anchor links (e.g. #view3) glide with the same easing.
		anchors: true,
		prevent: (node) =>
			node.id === 'webgi-canvas-container' ||
			node.classList.contains('footer-container'),
	});
	lenis.stop();

	lenis.on('scroll', ScrollTrigger.update);
	// Step Lenis inside GSAP's frame (same rAF as ScrollTrigger and the tweens)
	// but with real wall-clock time, so a dropped frame (e.g. a WebGL shader
	// compile) doesn't stall or slow the scroll glide via GSAP's lag smoothing.
	const tick = () => lenis.raf(performance.now());
	gsap.ticker.add(tick);

	instance = lenis;
	teardown = () => {
		gsap.ticker.remove(tick);
		lenis.off('scroll', ScrollTrigger.update);
		lenis.destroy();
		if (instance === lenis) instance = null;
		teardown = null;
	};
	return lenis;
}

let teardown: (() => void) | null = null;

/** Stop and remove the smooth-scroll instance (when leaving the home page). */
export function destroySmoothScroll(): void {
	teardown?.();
}
