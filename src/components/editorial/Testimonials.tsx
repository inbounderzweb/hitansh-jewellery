'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { testimonials } from '@/content/site';

const INTERVAL = 7000;

export default function Testimonials() {
	const [index, setIndex] = useState(0);
	const [paused, setPaused] = useState(false);
	const sectionRef = useRef<HTMLElement>(null);
	const total = testimonials.length;

	const go = useCallback(
		(delta: number) => setIndex((i) => (i + delta + total) % total),
		[total],
	);

	useEffect(() => {
		const reduce = window.matchMedia(
			'(prefers-reduced-motion: reduce)',
		).matches;
		if (paused || reduce) return;
		const id = window.setInterval(() => go(1), INTERVAL);
		return () => window.clearInterval(id);
	}, [paused, go]);

	return (
		<section
			ref={sectionRef}
			id="testimonials"
			className="testimonials"
			aria-roledescription="carousel"
			aria-labelledby="testimonials-title"
			onMouseEnter={() => setPaused(true)}
			onMouseLeave={() => setPaused(false)}
			onFocus={() => setPaused(true)}
			onBlur={() => setPaused(false)}
		>
			<div className="container testimonials__inner">
				<p
					id="testimonials-title"
					className="eyebrow eyebrow--center"
					data-reveal
				>
					Kind words
				</p>
				<div className="testimonials__stage" aria-live="polite">
					<svg
						className="testimonials__mark"
						viewBox="0 0 64 48"
						aria-hidden
					>
						<path d="M0 48V28C0 12 8 3 24 0l3 6C17 9 12 15 12 24h12v24H0zm36 0V28C36 12 44 3 60 0l3 6C53 9 48 15 48 24h12v24H36z" />
					</svg>
					{testimonials.map((t, i) => (
						<figure
							key={i}
							className={`testimonial${i === index ? ' is-active' : ''}`}
							role="group"
							aria-roledescription="slide"
							aria-label={`${i + 1} of ${total}`}
							aria-hidden={i !== index}
						>
							<blockquote className="testimonial__quote">
								{t.quote}
							</blockquote>
							<figcaption className="testimonial__cite">
								<span>{t.name}</span>
								{t.detail}
							</figcaption>
						</figure>
					))}
				</div>
				<div className="testimonials__controls">
					<button
						type="button"
						className="round-btn"
						onClick={() => go(-1)}
						aria-label="Previous testimonial"
					>
						<svg viewBox="0 0 24 24" aria-hidden>
							<path d="M15 6l-6 6 6 6" />
						</svg>
					</button>
					<div className="testimonials__dots">
						{testimonials.map((_, i) => (
							<button
								key={i}
								type="button"
								className={`dot${i === index ? ' is-active' : ''}`}
								aria-label={`Show testimonial ${i + 1}`}
								aria-current={i === index}
								onClick={() => setIndex(i)}
							>
								<span
									style={
										{
											'--dur': `${INTERVAL}ms`,
										} as React.CSSProperties
									}
									data-paused={paused || undefined}
								/>
							</button>
						))}
					</div>
					<button
						type="button"
						className="round-btn"
						onClick={() => go(1)}
						aria-label="Next testimonial"
					>
						<svg viewBox="0 0 24 24" aria-hidden>
							<path d="M9 6l6 6-6 6" />
						</svg>
					</button>
				</div>
			</div>
		</section>
	);
}
