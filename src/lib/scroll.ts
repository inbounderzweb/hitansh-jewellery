import { getLenis } from '@/lib/viewer/smoothScroll';
import { requestOpenStudio } from '@/lib/ringController';

type ScrollOptions = { onComplete?: () => void };

/**
 * Smoothly scroll to an on-page target (CSS selector or element). Uses the
 * page's Lenis instance when available so navigation glides with the same
 * easing as wheel scrolling; falls back to native smooth scrolling.
 * Does nothing while page scrolling is locked (intro / customizer).
 */
export function scrollToTarget(
	target: string | HTMLElement,
	{ onComplete }: ScrollOptions = {},
): boolean {
	// `#view3` is the "Design in 3D" navigation shortcut — open the 3D studio directly.
	if (target === '#view3') {
		requestOpenStudio();
		onComplete?.();
		return true;
	}

	const element =
		typeof target === 'string'
			? document.querySelector<HTMLElement>(target)
			: target;
	if (!element) return false;

	const lenis = getLenis();
	if (lenis) {
		if (lenis.isStopped) return false;
		let done = false;
		const finish = () => {
			if (done) return;
			done = true;
			onComplete?.();
		};
		lenis.scrollTo(element, { onComplete: finish });
		// Lenis skips the callback if we're already there.
		window.setTimeout(finish, 2800);
		return true;
	}

	element.scrollIntoView({ behavior: 'smooth' });
	if (onComplete) window.setTimeout(onComplete, 900);
	return true;
}

/**
 * Scroll cleanly to a specific 0-based slide index (0..3) inside the hero
 * 4-ring banner.
 */
export function scrollToHeroSlide(slideIndex: number): void {
	const heroEl = document.querySelector<HTMLElement>('#view1');
	if (!heroEl) return;
	const vh = window.innerHeight || 900;
	const pinSpan = Math.max(vh, heroEl.offsetHeight - vh);
	const clamped = Math.max(0, Math.min(3, slideIndex));
	// Land squarely inside the showcase rotation window of that slide
	const targetY = Math.round(((clamped + 0.35) / 4) * pinSpan);

	const lenis = getLenis();
	if (lenis && !lenis.isStopped) {
		lenis.scrollTo(targetY);
	} else {
		window.scrollTo({ top: targetY, behavior: 'smooth' });
	}
}

/**
 * Open the 3D studio customizer overlay and pre-select a gemstone and metal.
 * Names must match the material names in the 3D model's configurator.
 */
export function openInConfigurator(gem?: string, metal?: string): void {
	requestOpenStudio({ gem, metal });
}
