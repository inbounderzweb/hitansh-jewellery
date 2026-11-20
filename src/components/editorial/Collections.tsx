'use client';

import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import type { Collection } from '@/lib/catalogue';
import CatalogueImage from '@/components/catalogue/CatalogueImage';
import { scrollToTarget } from '@/lib/scroll';
import { collectionFilter, selectProductFilter } from './filterEvents';

gsap.registerPlugin(ScrollTrigger);

const Arrow = () => (
	<svg viewBox="0 0 24 24" aria-hidden fill="none" stroke="currentColor">
		<path d="M4 12h15M13 6l6 6-6 6" strokeWidth="1.2" />
	</svg>
);

/**
 * Collections as editorial "chapters".
 *
 * Desktop: a sticky index on the left (rolling numeral, chapter titles,
 * the active chapter's description) follows three tall frames scrolling on
 * the right; whichever frame crosses the viewport centre becomes active.
 * Phones: the frames stack, each with its own caption.
 *
 * Choosing a chapter keeps its original behaviour: it pre-filters the
 * product showcase below and scrolls there.
 */
export default function Collections({
	collections,
}: {
	collections: Collection[];
}) {
	const [active, setActive] = useState(0);
	const rootRef = useRef<HTMLElement>(null);

	const explore = (slug: string) => {
		selectProductFilter(collectionFilter(slug));
		scrollToTarget('#showcase');
	};

	useEffect(() => {
		const root = rootRef.current;
		if (!root) return;
		const mm = gsap.matchMedia(root);

		mm.add('(min-width: 901px)', () => {
			root.querySelectorAll<HTMLElement>('.chapter').forEach(
				(frame, index) => {
					ScrollTrigger.create({
						trigger: frame,
						start: 'top 55%',
						end: 'bottom 55%',
						onToggle: (self) => {
							if (self.isActive) setActive(index);
						},
					});
				},
			);

			const list = root.querySelector('.chapters__frames');
			const bar = root.querySelector('.chapters__progress span');
			if (list && bar)
				gsap.fromTo(
					bar,
					{ scaleY: 0 },
					{
						scaleY: 1,
						ease: 'none',
						scrollTrigger: {
							trigger: list,
							start: 'top 55%',
							end: 'bottom 55%',
							scrub: true,
						},
					},
				);
		});

		// Slow drift of each photograph inside its frame.
		mm.add('(prefers-reduced-motion: no-preference)', () => {
			root.querySelectorAll<HTMLElement>('.chapter__drift').forEach(
				(drift) => {
					gsap.fromTo(
						drift,
						{ yPercent: -7 },
						{
							yPercent: 7,
							ease: 'none',
							scrollTrigger: {
								trigger: drift.parentElement,
								start: 'top bottom',
								end: 'bottom top',
								scrub: true,
							},
						},
					);
				},
			);
		});

		return () => mm.revert();
	}, [collections.length]);

	if (!collections.length) return null;
	const current = collections[Math.min(active, collections.length - 1)];

	return (
		<section
			ref={rootRef}
			id="collections"
			className="collections"
			aria-labelledby="collections-title"
		>
			<div className="container">
				<div className="section-head">
					<div>
						<p className="eyebrow" data-reveal>
							Collections
						</p>
						<h2
							id="collections-title"
							className="display"
							data-split
						>
							Curated for every <em>chapter</em>
						</h2>
					</div>
					<a className="link" href="#showcase" data-reveal>
						View all pieces
					</a>
				</div>

				<div className="chapters">
					{/* Desktop index — hidden on phones, where captions take over. */}
					<aside className="chapters__index" aria-label="Collections">
						<div className="chapters__sticky">
							<div className="chapters__numeral" aria-hidden>
								<span className="chapters__roll">
									<span
										style={{
											transform: `translateY(${-active}em)`,
										}}
									>
										{collections.map((c) => (
											<span key={c.id}>{c.index}</span>
										))}
									</span>
								</span>
								<span className="chapters__total">
									/{' '}
									{String(collections.length).padStart(
										2,
										'0',
									)}
								</span>
							</div>

							<ol className="chapters__titles">
								{collections.map((c, i) => (
									<li key={c.id}>
										<button
											type="button"
											className="chapters__title"
											aria-current={
												i === active
													? 'true'
													: undefined
											}
											onClick={() => explore(c.slug)}
										>
											{c.title}
										</button>
									</li>
								))}
							</ol>

							<div className="chapters__copy">
								{collections.map((c, i) => (
									<p
										key={c.id}
										aria-hidden={i !== active}
										className={
											i === active ? 'is-active' : ''
										}
									>
										{c.description}
									</p>
								))}
							</div>

							<button
								type="button"
								className="link chapters__cta"
								onClick={() => explore(current.slug)}
							>
								Explore {current.title}
								<Arrow />
							</button>

							<div className="chapters__progress" aria-hidden>
								<span />
							</div>
						</div>
					</aside>

					<div className="chapters__frames">
						{collections.map((c, i) => (
							<article
								key={c.id}
								className={`chapter chapter--${(i % 3) + 1}`}
								aria-labelledby={`chapter-${c.id}`}
							>
								<button
									type="button"
									className="chapter__hit"
									onClick={() => explore(c.slug)}
									aria-label={`Explore ${c.title}`}
								/>
								<div
									className="chapter__media"
									data-image-reveal
								>
									<div className="chapter__drift">
										{c.cover && (
											<CatalogueImage
												src={c.cover.url}
												alt=""
												fill
												sizes="(max-width: 900px) 92vw, 50vw"
											/>
										)}
									</div>
								</div>
								<div className="chapter__caption">
									<span className="chapter__index">
										{c.index}
									</span>
									<h3
										id={`chapter-${c.id}`}
										className="chapter__title"
									>
										{c.title}
									</h3>
									<p className="chapter__text">
										{c.description}
									</p>
									<span className="link" aria-hidden>
										Explore <Arrow />
									</span>
								</div>
							</article>
						))}
					</div>
				</div>
			</div>
		</section>
	);
}
