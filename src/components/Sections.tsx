'use client';

import type { HeroRingSlide } from '@/lib/ringController';
import type { FilterId } from '@/components/editorial/filterEvents';
import {
	openInConfigurator,
	scrollToHeroSlide,
	scrollToTarget,
} from '@/lib/scroll';
import { selectProductFilter } from '@/components/editorial/filterEvents';
import HeroPhotos from '@/components/HeroPhotos';

const Arrow = () => (
	<svg viewBox="0 0 24 24" fill="none" aria-hidden>
		<path
			d="M5 12h14M13 6l6 6-6 6"
			stroke="currentColor"
			strokeWidth="1.3"
			strokeLinecap="round"
			strokeLinejoin="round"
		/>
	</svg>
);

/**
 * Full-screen interactive 4-ring hero banner (`#view1`).
 *
 * Vertical scrolling drives 4 connected showcase slides:
 *   - Center:       3D ring with smooth 360° rotation, depth & opacity transitions
 *   - Behind ring:  Architectural "HITANSH" wordmark + rotating Champagne Gold halo
 *   - Bottom Left:  Collection name, gemstone/metal spec, short editorial description
 *   - Bottom Right: Slide indicator (01 / 04), interactive 4-slide rail, Explore CTA
 *
 * After the 4th ring completes, normal browser scrolling releases seamlessly
 * into the editorial sections below.
 */
export default function Sections({ slides }: { slides: HeroRingSlide[] }) {
	const total = String(slides.length).padStart(2, '0');
	const handleExplore = (filterTarget: FilterId) => {
		selectProductFilter(filterTarget);
		scrollToTarget('#showcase');
	};

	return (
		<div className="container-hide">
			<section
				id="view1"
				className="hero-showcase"
				aria-labelledby="hero-title"
				style={
					{ '--hero-slides': slides.length } as React.CSSProperties
				}
			>
				<div className="hero-stage">
					{/* Architectural backdrop behind the 3D ring (z-index: 0) */}
					<div className="hero-backdrop" aria-hidden>
						<div className="hero-backdrop__word">
							<span className="hero-backdrop__word-inner">
								HITANSH
							</span>
						</div>

						{/* Delicate rotating Champagne Gold orbital compass ring */}
						<svg
							className="hero-backdrop__halo"
							viewBox="0 0 600 600"
							fill="none"
						>
							<circle
								cx="300"
								cy="300"
								r="248"
								stroke="rgba(212, 176, 106, 0.16)"
								strokeWidth="1"
								strokeDasharray="3 10"
							/>
							<circle
								cx="300"
								cy="300"
								r="214"
								stroke="rgba(212, 176, 106, 0.1)"
								strokeWidth="1"
							/>
							<line
								x1="300"
								y1="38"
								x2="300"
								y2="56"
								stroke="rgba(212, 176, 106, 0.45)"
								strokeWidth="1"
							/>
							<line
								x1="300"
								y1="544"
								x2="300"
								y2="562"
								stroke="rgba(212, 176, 106, 0.45)"
								strokeWidth="1"
							/>
							<line
								x1="38"
								y1="300"
								x2="56"
								y2="300"
								stroke="rgba(212, 176, 106, 0.45)"
								strokeWidth="1"
							/>
							<line
								x1="544"
								y1="300"
								x2="562"
								y2="300"
								stroke="rgba(212, 176, 106, 0.45)"
								strokeWidth="1"
							/>
						</svg>
					</div>

					{/* Photo slides: the ring's views, between backdrop and UI (z-index: 1) */}
					<HeroPhotos slides={slides} />

					{/* Foreground UI: Bottom-Left & Bottom-Right (z-index: 2) */}
					<div className="hero-ui">
						{/* BOTTOM LEFT: Collection name, spec & short description */}
						<div className="hero-ui__left">
							{slides.map((slide, idx) => (
								<div
									key={slide.id}
									className={`hero-copy${idx === 0 ? ' is-active' : ''}`}
									data-hero-copy={idx}
									aria-hidden={idx !== 0}
								>
									<p
										className="eyebrow"
										data-hero-reveal={
											idx === 0 ? true : undefined
										}
									>
										{slide.index} · {slide.collection}
									</p>
									{idx === 0 ? (
										<h1
											id="hero-title"
											className="display hero-copy__title"
											data-hero-reveal
										>
											{slide.name}
										</h1>
									) : (
										<h2 className="display hero-copy__title">
											{slide.name}
										</h2>
									)}
									{/* <div
										className="hero-copy__spec"
										data-hero-reveal={
											idx === 0 ? true : undefined
										}
									>
										<span
											className="hero-copy__dot"
											style={{
												background: slide.accentColor,
											}}
											aria-hidden
										/>
										<span>{slide.spec}</span>
									</div> */}
									<p
										className="hero-copy__desc"
										data-hero-reveal={
											idx === 0 ? true : undefined
										}
									>
										{slide.description}
									</p>
								</div>
							))}
						</div>

						{/* CENTER BOTTOM: Subtle scroll indicator */}
						<div className="hero-ui__scroll" aria-hidden>
							<span className="hero__scroll-line" />
							<span className="hero-ui__scroll-label">
								Scroll
							</span>
						</div>

						{/* BOTTOM RIGHT: Slide counter (01/04), interactive rail, Explore CTA */}
						<div className="hero-ui__right">
							{/* <div
								className="hero-counter"
								aria-live="polite"
								data-hero-reveal
							>
								<span className="hero-counter__current">
									01
								</span>
								<span className="hero-counter__sep">/</span>
								<span className="hero-counter__total">04</span>
							</div> */}

							<nav
								className="hero-nav"
								aria-label="Hero ring showcase slides"
								data-hero-reveal
							>
								{slides.map((slide, idx) => (
									<button
										key={slide.id}
										type="button"
										className={`hero-nav__item${idx === 0 ? ' is-active' : ''}`}
										data-hero-nav={idx}
										onClick={() => scrollToHeroSlide(idx)}
										aria-label={`View ${slide.name} (${slide.index} of ${total})`}
									>
										<span className="hero-nav__num">
											{slide.index}
										</span>
										<span className="hero-nav__track">
											<span
												className="hero-nav__fill"
												data-hero-fill={idx}
											/>
										</span>
									</button>
								))}
							</nav>

							<div className="hero-cta-stack" data-hero-reveal>
								{slides.map((slide, idx) => (
									<div
										key={slide.id}
										className={`hero-cta-group${idx === 0 ? ' is-active' : ''}`}
										data-hero-cta={idx}
									>
										<button
											type="button"
											className="btn btn--gold hero-cta__primary"
											onClick={() =>
												handleExplore(
													slide.filterTarget,
												)
											}
										>
											Explore Collection
											<Arrow />
										</button>
										{!slide.photos?.length &&
											!slide.spin?.length && (
												<button
													type="button"
													className="link hero-cta__secondary"
													onClick={() =>
														openInConfigurator(
															slide.gem,
															slide.metal,
														)
													}
												>
													Customise in 3D
													<Arrow />
												</button>
											)}
									</div>
								))}
							</div>
						</div>
					</div>
				</div>
			</section>
		</div>
	);
}
