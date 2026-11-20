'use client';

import { useEffect } from 'react';
import type { HeroRingSlide } from '@/lib/ringController';

type Teardown = () => void;

// The viewer binds to a single <canvas> and registers global listeners, a
// GSAP ticker, Lenis and ScrollTriggers. It is torn down when the home page
// unmounts (client-side navigation) and started again on return. Starts and
// teardowns are serialised so React Strict Mode's double effect, or a quick
// navigation away mid-load, can never leave two viewers on one canvas.
let queue: Promise<unknown> = Promise.resolve();

/**
 * Renders the WebGL canvas and boots the WebGi + GSAP experience on the client.
 * `webgi` is browser-only, so it is loaded with a dynamic import inside an
 * effect and never evaluated during server rendering.
 */
export default function WebgiViewer({ slides }: { slides: HeroRingSlide[] }) {
	useEffect(() => {
		let cancelled = false;

		const started = queue.then(async (): Promise<Teardown | null> => {
			if (cancelled) return null;
			try {
				const { setupViewer } =
					await import('@/lib/viewer/setupViewer');
				return await setupViewer(slides);
			} catch (error: unknown) {
				console.error('Failed to initialise the 3D viewer', error);
				// Without WebGL the rest of the site must stay usable: lift the
				// loader and unlock native scrolling.
				const loader = document.querySelector<HTMLElement>('.loader');
				if (loader) loader.style.display = 'none';
				document.documentElement.style.overflowY = 'visible';
				document.body.style.overflowY = 'visible';
				return null;
			}
		});
		queue = started;

		return () => {
			cancelled = true;
			// Runs once the (possibly still loading) viewer has finished booting.
			queue = started.then((teardown) => {
				try {
					teardown?.();
				} catch (error) {
					console.error('Failed to tear down the 3D viewer', error);
				}
			});
		};
		// Slides only change on a fresh page load; the viewer boots once.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	return (
		<div id="webgi-canvas-container">
			<canvas id="webgi-canvas"></canvas>
		</div>
	);
}
