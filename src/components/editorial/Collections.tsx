'use client';

import Image from 'next/image';
import { collections } from '@/content/site';
import { scrollToTarget } from '@/lib/scroll';
import { selectProductFilter } from './filterEvents';

export default function Collections() {
	const explore = (filter: (typeof collections)[number]['filter']) => {
		selectProductFilter(filter);
		scrollToTarget('#showcase');
	};

	return (
		<section
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

				<div className="collections__grid">
					{collections.map((c, i) => (
						<article
							key={c.id}
							className={`collection-card collection-card--${i + 1}`}
						>
							<button
								type="button"
								className="collection-card__hit"
								onClick={() => explore(c.filter)}
								aria-label={`Explore ${c.title}`}
							/>
							<div
								className="collection-card__media"
								data-image-reveal
							>
								<Image
									src={c.image}
									alt=""
									fill
									sizes={
										i === 0
											? '(max-width: 760px) 92vw, 46vw'
											: '(max-width: 760px) 92vw, 42vw'
									}
								/>
							</div>
							<div className="collection-card__body" data-reveal>
								<span className="collection-card__index">
									{c.index}
								</span>
								<h3 className="collection-card__title">
									{c.title}
								</h3>
								<p className="collection-card__text">
									{c.description}
								</p>
								<span className="link" aria-hidden>
									Explore
								</span>
							</div>
						</article>
					))}
				</div>
			</div>
		</section>
	);
}
