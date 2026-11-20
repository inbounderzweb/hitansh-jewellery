'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { BANNER_SLOTS, glowRgba, type BannerRing } from '@/lib/banner';
import CatalogueImage from '@/components/catalogue/CatalogueImage';

gsap.registerPlugin(ScrollTrigger);

/**
 * Awwwards-style Sticky 4-Ring Prismatic Unfolding Showcase (`#quartet`).
 *
 * Pure borderless negative space with kinetic light choreography:
 *   - Begins with a single macro front-facing ring suspended in a golden spotlight.
 *   - As the user scrolls, a prism light pulse radiates from center and each of
 *     the remaining three rings unfolds out from *inside* the center ring along
 *     curved 3D arcs with light-bloom reveals into a balanced four-ring constellation.
 *   - Pointer parallax; each ring links to its product page.
 */
export default function RingQuartet({ rings }: { rings: BannerRing[] }) {
	// Re-run the choreography if the set of rings changes.
	const ringKey = rings.map((r) => r.id).join('|');
	const sectionRef = useRef<HTMLElement>(null);
	const stageRef = useRef<HTMLDivElement>(null);
	const ringRefs = useRef<(HTMLAnchorElement | null)[]>([]);
	const labelRefs = useRef<(HTMLSpanElement | null)[]>([]);
	const auraRef = useRef<HTMLDivElement>(null);
	const pulseRef = useRef<HTMLDivElement>(null);
	const filamentRef = useRef<HTMLDivElement>(null);
	const astrolabeRef = useRef<SVGSVGElement>(null);
	const watermarkRef = useRef<HTMLSpanElement>(null);

	useEffect(() => {
		const section = sectionRef.current;
		const stage = stageRef.current;
		if (!section || !stage) return;

		const [r0, r1, r2, r3] = ringRefs.current;
		const [l0, l1, l2, l3] = labelRefs.current;
		if (!r0 || !r1 || !r2 || !r3) return;

		// Subtle 3D pointer parallax on the floating constellation
		const onPointerMove = (e: PointerEvent) => {
			if (window.innerWidth <= 768) return;
			const rect = stage.getBoundingClientRect();
			const nx =
				((e.clientX - rect.left) / Math.max(1, rect.width) - 0.5) * 2;
			const ny =
				((e.clientY - rect.top) / Math.max(1, rect.height) - 0.5) * 2;

			gsap.to(stage, {
				rotateY: nx * 5,
				rotateX: -ny * 4,
				duration: 0.9,
				ease: 'power2.out',
				overwrite: 'auto',
			});
			if (auraRef.current) {
				gsap.to(auraRef.current, {
					x: nx * 40,
					y: ny * 30,
					duration: 1.1,
					ease: 'power2.out',
					overwrite: 'auto',
				});
			}
		};

		const onPointerLeave = () => {
			gsap.to(stage, {
				rotateY: 0,
				rotateX: 0,
				duration: 1.1,
				ease: 'power3.out',
				overwrite: 'auto',
			});
		};

		stage.addEventListener('pointermove', onPointerMove, { passive: true });
		stage.addEventListener('pointerleave', onPointerLeave, {
			passive: true,
		});

		const mm = gsap.matchMedia();

		// Desktop & Tablet choreography
		mm.add(
			'(min-width: 769px) and (prefers-reduced-motion: no-preference)',
			() => {
				// Ring 1 starts macro & radiant in center; Rings 2–4 nested inside Ring 1
				gsap.set(r0, {
					xPercent: 0,
					yPercent: 0,
					scale: 1.48,
					rotateY: 0,
					rotateZ: 0,
					opacity: 1,
					zIndex: 4,
					filter: 'blur(0px) brightness(1.08)',
				});
				gsap.set(r1, {
					xPercent: 0,
					yPercent: 16,
					scale: 0.42,
					rotateY: 28,
					rotateZ: -10,
					opacity: 0,
					zIndex: 3,
					filter: 'blur(12px) brightness(1.75)',
				});
				gsap.set(r2, {
					xPercent: 0,
					yPercent: 18,
					scale: 0.42,
					rotateY: -28,
					rotateZ: 10,
					opacity: 0,
					zIndex: 2,
					filter: 'blur(12px) brightness(1.75)',
				});
				gsap.set(r3, {
					xPercent: 0,
					yPercent: 20,
					scale: 0.42,
					rotateY: 26,
					rotateZ: -8,
					opacity: 0,
					zIndex: 1,
					filter: 'blur(12px) brightness(1.75)',
				});

				if (l0 && l1 && l2 && l3) {
					gsap.set([l0, l1, l2, l3], { opacity: 0, y: 12 });
					gsap.set(l0, { opacity: 0.78, y: 0 });
				}
				if (filamentRef.current) {
					gsap.set(filamentRef.current, { scaleX: 0, opacity: 0.65 });
				}
				if (pulseRef.current) {
					gsap.set(pulseRef.current, { scale: 0.3, opacity: 0 });
				}

				const tl = gsap.timeline({
					defaults: { ease: 'power3.inOut' },
					scrollTrigger: {
						trigger: section,
						start: 'top top',
						end: 'bottom bottom',
						scrub: 0.85,
					},
				});

				// Ambient kinetic backdrop synced across the full scroll
				if (astrolabeRef.current) {
					tl.to(
						astrolabeRef.current,
						{
							rotate: 160,
							scale: 1.18,
							opacity: 0.35,
							duration: 3.6,
							ease: 'none',
						},
						0,
					);
				}
				if (watermarkRef.current) {
					tl.fromTo(
						watermarkRef.current,
						{ letterSpacing: '0.16em', scale: 0.94, opacity: 0.14 },
						{
							letterSpacing: '0.38em',
							scale: 1.08,
							opacity: 0.06,
							duration: 3.6,
							ease: 'none',
						},
						0,
					);
				}
				if (filamentRef.current) {
					tl.to(
						filamentRef.current,
						{ scaleX: 1, opacity: 0.35, duration: 1.4 },
						0.05,
					).to(
						filamentRef.current,
						{ opacity: 0.12, duration: 1.6 },
						2.0,
					);
				}

				// ACT 1 -> 2: Light pulse + Ring 2 unfolds out from inside Ring 1 to the LEFT
				if (pulseRef.current) {
					tl.fromTo(
						pulseRef.current,
						{ scale: 0.35, opacity: 0.65 },
						{
							scale: 2.2,
							opacity: 0,
							duration: 1.0,
							ease: 'power2.out',
						},
						0.12,
					);
				}
				if (auraRef.current) {
					tl.to(
						auraRef.current,
						{
							background:
								'radial-gradient(circle, rgba(232,62,98,0.22) 0%, rgba(212,176,106,0.08) 46%, transparent 72%)',
							scale: 1.15,
							duration: 1.0,
						},
						0.15,
					);
				}
				tl.to(
					r0,
					{
						xPercent: 54,
						yPercent: -3,
						scale: 1.08,
						rotateY: -6,
						filter: 'blur(0px) brightness(1)',
						duration: 1.05,
					},
					0.12,
				).to(
					r1,
					{
						xPercent: -54,
						yPercent: -3,
						scale: 1.06,
						rotateY: 6,
						rotateZ: 0,
						opacity: 1,
						filter: 'blur(0px) brightness(1)',
						duration: 1.05,
					},
					0.12,
				);
				if (l1) {
					tl.to(l1, { opacity: 0.78, y: 0, duration: 0.55 }, 0.7);
				}

				// ACT 2 -> 3: Ring 3 unfolds out from inside center to the RIGHT into a triptych
				if (pulseRef.current) {
					tl.fromTo(
						pulseRef.current,
						{ scale: 0.35, opacity: 0.55 },
						{
							scale: 2.3,
							opacity: 0,
							duration: 1.0,
							ease: 'power2.out',
						},
						1.28,
					);
				}
				if (auraRef.current) {
					tl.to(
						auraRef.current,
						{
							background:
								'radial-gradient(circle, rgba(62,134,248,0.22) 0%, rgba(212,176,106,0.07) 48%, transparent 72%)',
							scale: 1.25,
							duration: 1.0,
						},
						1.3,
					);
				}
				tl.to(
					r1,
					{
						xPercent: -106,
						yPercent: 4,
						scale: 0.96,
						rotateY: 8,
						duration: 1.05,
					},
					1.28,
				)
					.to(
						r0,
						{
							xPercent: 0,
							yPercent: -7,
							scale: 1.08,
							rotateY: 0,
							duration: 1.05,
						},
						1.28,
					)
					.to(
						r2,
						{
							xPercent: 106,
							yPercent: 4,
							scale: 0.96,
							rotateY: -8,
							rotateZ: 0,
							opacity: 1,
							filter: 'blur(0px) brightness(1)',
							duration: 1.05,
						},
						1.28,
					);
				if (l2) {
					tl.to(l2, { opacity: 0.78, y: 0, duration: 0.55 }, 1.85);
				}

				// ACT 3 -> 4: Ring 4 unfolds out from inside center to the LEFT into the grand 4-ring arch
				if (pulseRef.current) {
					tl.fromTo(
						pulseRef.current,
						{ scale: 0.4, opacity: 0.6 },
						{
							scale: 2.6,
							opacity: 0,
							duration: 1.1,
							ease: 'power2.out',
						},
						2.45,
					);
				}
				if (auraRef.current) {
					tl.to(
						auraRef.current,
						{
							background:
								'radial-gradient(ellipse 68% 45% at 50% 50%, rgba(212,176,106,0.2) 0%, rgba(26,204,114,0.08) 46%, transparent 76%)',
							scale: 1.38,
							duration: 1.1,
						},
						2.45,
					);
				}
				tl.to(
					r3,
					{
						xPercent: -152,
						yPercent: 6,
						scale: 0.92,
						rotateY: 6,
						rotateZ: 0,
						opacity: 1,
						filter: 'blur(0px) brightness(1)',
						duration: 1.1,
					},
					2.45,
				)
					.to(
						r1,
						{
							xPercent: -51,
							yPercent: -6,
							scale: 0.98,
							rotateY: 2,
							duration: 1.1,
						},
						2.45,
					)
					.to(
						r0,
						{
							xPercent: 51,
							yPercent: -6,
							scale: 0.98,
							rotateY: -2,
							duration: 1.1,
						},
						2.45,
					)
					.to(
						r2,
						{
							xPercent: 152,
							yPercent: 6,
							scale: 0.92,
							rotateY: -6,
							duration: 1.1,
						},
						2.45,
					);
				if (l3) {
					tl.to(l3, { opacity: 0.78, y: 0, duration: 0.55 }, 3.0);
				}
			},
		);

		// Mobile choreography: emerges from inside Ring 1 into a balanced 2x2 constellation
		mm.add(
			'(max-width: 768px) and (prefers-reduced-motion: no-preference)',
			() => {
				gsap.set(r0, {
					xPercent: 0,
					yPercent: 0,
					scale: 1.28,
					rotateY: 0,
					opacity: 1,
					zIndex: 4,
					filter: 'blur(0px) brightness(1.06)',
				});
				gsap.set([r1, r2, r3], {
					xPercent: 0,
					yPercent: 0,
					scale: 0.45,
					opacity: 0,
					filter: 'blur(10px) brightness(1.7)',
				});
				gsap.set(r1, { rotateY: 18, zIndex: 3 });
				gsap.set(r2, { rotateY: -18, zIndex: 2 });
				gsap.set(r3, { rotateY: 18, zIndex: 1 });
				if (l0 && l1 && l2 && l3) {
					gsap.set([l0, l1, l2, l3], { opacity: 0, y: 8 });
					gsap.set(l0, { opacity: 0.8, y: 0 });
				}

				const tl = gsap.timeline({
					defaults: { ease: 'power3.inOut' },
					scrollTrigger: {
						trigger: section,
						start: 'top top',
						end: 'bottom bottom',
						scrub: 0.7,
					},
				});

				if (astrolabeRef.current) {
					tl.to(
						astrolabeRef.current,
						{ rotate: 140, duration: 3.3, ease: 'none' },
						0,
					);
				}

				tl.to(
					r0,
					{ xPercent: 52, yPercent: -50, scale: 0.94, duration: 1 },
					0.1,
				).to(
					r1,
					{
						xPercent: -52,
						yPercent: -50,
						scale: 0.94,
						rotateY: 0,
						opacity: 1,
						filter: 'blur(0px) brightness(1)',
						duration: 1,
					},
					0.1,
				);
				if (l1) tl.to(l1, { opacity: 0.8, y: 0, duration: 0.45 }, 0.65);

				tl.to(
					r2,
					{
						xPercent: 52,
						yPercent: 50,
						scale: 0.94,
						rotateY: 0,
						opacity: 1,
						filter: 'blur(0px) brightness(1)',
						duration: 1,
					},
					1.2,
				);
				if (l2) tl.to(l2, { opacity: 0.8, y: 0, duration: 0.45 }, 1.75);

				tl.to(
					r3,
					{
						xPercent: -52,
						yPercent: 50,
						scale: 0.94,
						rotateY: 0,
						opacity: 1,
						filter: 'blur(0px) brightness(1)',
						duration: 1,
					},
					2.3,
				);
				if (l3) tl.to(l3, { opacity: 0.8, y: 0, duration: 0.45 }, 2.8);
			},
		);

		return () => {
			stage.removeEventListener('pointermove', onPointerMove);
			stage.removeEventListener('pointerleave', onPointerLeave);
			mm.revert();
		};
	}, [ringKey]);

	// The choreography is designed for exactly four rings.
	if (rings.length < BANNER_SLOTS) return null;

	return (
		<section
			ref={sectionRef}
			id="quartet"
			className="quartet"
			aria-label="Signature four-ring showcase"
		>
			<div className="quartet__sticky">
				{/* Volumetric light aura & radial pulse */}
				<div ref={auraRef} className="quartet__aura" aria-hidden />
				<div ref={pulseRef} className="quartet__pulse" aria-hidden />
				<div
					ref={filamentRef}
					className="quartet__filament"
					aria-hidden
				/>

				{/* Whisper-minimal kinetic background watermark */}
				<div className="quartet__watermark" aria-hidden>
					<span ref={watermarkRef}>BRILLIANCE</span>
				</div>

				{/* Rotating Champagne Gold astrolabe geometry */}
				<svg
					ref={astrolabeRef}
					className="quartet__astrolabe"
					viewBox="0 0 800 800"
					fill="none"
					aria-hidden
				>
					<circle
						cx="400"
						cy="400"
						r="340"
						stroke="rgba(212, 176, 106, 0.14)"
						strokeWidth="1"
						strokeDasharray="2 12"
					/>
					<circle
						cx="400"
						cy="400"
						r="250"
						stroke="rgba(212, 176, 106, 0.09)"
						strokeWidth="1"
					/>
					<line
						x1="400"
						y1="36"
						x2="400"
						y2="64"
						stroke="rgba(212, 176, 106, 0.4)"
						strokeWidth="1"
					/>
					<line
						x1="400"
						y1="736"
						x2="400"
						y2="764"
						stroke="rgba(212, 176, 106, 0.4)"
						strokeWidth="1"
					/>
					<line
						x1="36"
						y1="400"
						x2="64"
						y2="400"
						stroke="rgba(212, 176, 106, 0.4)"
						strokeWidth="1"
					/>
					<line
						x1="736"
						y1="400"
						x2="764"
						y2="400"
						stroke="rgba(212, 176, 106, 0.4)"
						strokeWidth="1"
					/>
				</svg>

				{/* Floating borderless 4-ring constellation */}
				<div ref={stageRef} className="quartet__stage">
					{rings.slice(0, BANNER_SLOTS).map((ring, idx) => (
						<Link
							key={ring.id}
							ref={(el) => {
								ringRefs.current[idx] = el;
							}}
							href={ring.href}
							className="quartet-ring"
							style={
								{
									'--ring-glow': glowRgba(ring.glow),
								} as React.CSSProperties
							}
							aria-label={`View ${ring.name} details`}
						>
							<span className="quartet-ring__visual">
								<CatalogueImage
									src={ring.image}
									alt={ring.alt}
									fill
									sizes="(max-width: 768px) 46vw, 24vw"
									className="quartet-ring__img"
								/>
							</span>
							<span
								ref={(el) => {
									labelRefs.current[idx] = el;
								}}
								className="quartet-ring__label"
							>
								{ring.name}
							</span>
						</Link>
					))}
				</div>
			</div>
		</section>
	);
}
