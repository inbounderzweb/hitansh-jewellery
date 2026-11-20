'use client';

import { useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';

gsap.registerPlugin(ScrollTrigger, SplitText);

/**
 * Scroll-driven motion for the editorial sections (below the 3D stage).
 * Opt-in via data attributes so components stay declarative:
 *
 *   data-split          heading lines rise out of a mask
 *   data-scrub-words    words brighten as the paragraph scrolls through
 *   data-reveal         fade + rise once (siblings are staggered)
 *   data-image-reveal   clip-path wipe with a gentle zoom-out
 *   data-speed="0.1"    parallax drift (fraction of the element's height)
 *   data-scrub-progress vertical progress line tied to its section
 *
 * Content is fully visible without JavaScript; initial hidden states are
 * only applied here. Users who prefer reduced motion get static content.
 */
export default function ScrollEffects() {
	useEffect(() => {
		const mm = gsap.matchMedia();
		let cancelled = false;

		const init = () => {
			if (cancelled) return;
			mm.add('(prefers-reduced-motion: no-preference)', () => {
				// Split-line headings
				gsap.utils
					.toArray<HTMLElement>('.editorial [data-split]')
					.forEach((el) => {
						SplitText.create(el, {
							type: 'lines',
							mask: 'lines',
							linesClass: 'split-line',
							autoSplit: true,
							onSplit: (self) =>
								gsap.from(self.lines, {
									yPercent: 110,
									duration: 1.3,
									ease: 'power4.out',
									stagger: 0.1,
									scrollTrigger: {
										trigger: el,
										start: 'top 88%',
										once: true,
									},
								}),
						});
					});

				// Brand statement: words light up with scroll
				gsap.utils
					.toArray<HTMLElement>('[data-scrub-words]')
					.forEach((el) => {
						SplitText.create(el, {
							type: 'words',
							autoSplit: true,
							onSplit: (self) =>
								gsap.fromTo(
									self.words,
									{ opacity: 0.16 },
									{
										opacity: 1,
										ease: 'none',
										stagger: 0.08,
										scrollTrigger: {
											trigger: el,
											start: 'top 80%',
											end: 'bottom 45%',
											scrub: 0.6,
										},
									},
								),
						});
					});

				// Fade + rise, staggered among siblings entering together
				gsap.set('.editorial [data-reveal]', { opacity: 0, y: 36 });
				ScrollTrigger.batch('.editorial [data-reveal]', {
					start: 'top 90%',
					once: true,
					onEnter: (batch) =>
						gsap.fromTo(
							batch,
							{ opacity: 0, y: 36 },
							{
								opacity: 1,
								y: 0,
								duration: 1.2,
								ease: 'power3.out',
								stagger: 0.1,
								overwrite: true,
							},
						),
				});

				// Image wipe + settle
				gsap.utils
					.toArray<HTMLElement>('[data-image-reveal]')
					.forEach((frame) => {
						const img = frame.querySelector('img');
						const tl = gsap.timeline({
							scrollTrigger: {
								trigger: frame,
								start: 'top 85%',
								once: true,
							},
						});
						tl.fromTo(
							frame,
							{ clipPath: 'inset(100% 0% 0% 0%)' },
							{
								clipPath: 'inset(0% 0% 0% 0%)',
								duration: 1.6,
								ease: 'power4.inOut',
							},
						);
						if (img)
							tl.fromTo(
								img,
								{ scale: 1.25 },
								{ scale: 1, duration: 2, ease: 'power3.out' },
								0,
							);
					});

				// Parallax
				gsap.utils
					.toArray<HTMLElement>('.editorial [data-speed]')
					.forEach((el) => {
						const speed = parseFloat(el.dataset.speed ?? '0');
						gsap.fromTo(
							el,
							{ yPercent: -speed * 100 },
							{
								yPercent: speed * 100,
								ease: 'none',
								scrollTrigger: {
									trigger: el.parentElement ?? el,
									start: 'top bottom',
									end: 'bottom top',
									scrub: true,
								},
							},
						);
					});

				// Craft progress line
				gsap.utils
					.toArray<HTMLElement>('[data-scrub-progress]')
					.forEach((el) => {
						gsap.fromTo(
							el,
							{ scaleY: 0 },
							{
								scaleY: 1,
								ease: 'none',
								scrollTrigger: {
									trigger: el.closest('.craft__list') ?? el,
									start: 'top 70%',
									end: 'bottom 60%',
									scrub: true,
								},
							},
						);
					});
			});
		};

		// Split text only once web fonts are ready so line breaks are final.
		document.fonts.ready.then(init);

		return () => {
			cancelled = true;
			mm.revert();
		};
	}, []);

	return null;
}
