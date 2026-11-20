import { craftSteps } from '@/content/site';

export default function Craftsmanship() {
	return (
		<section id="craft" className="craft" aria-labelledby="craft-title">
			<div className="container craft__grid">
				<div className="craft__intro">
					<p className="eyebrow" data-reveal>
						Craftsmanship
					</p>
					<h2 id="craft-title" className="display" data-split>
						The art of the <em>atelier</em>
					</h2>
					<p className="lede" data-reveal>
						Four quiet stages, unhurried by design. Each one is an
						opportunity to make the piece a little more perfect.
					</p>
				</div>
				<div className="craft__list">
					<span className="craft__progress" aria-hidden>
						<span data-scrub-progress />
					</span>
					<ol className="craft__steps">
						{craftSteps.map((step) => (
							<li
								key={step.number}
								className="craft__step"
								data-reveal
							>
								<span className="craft__number">
									{step.number}
								</span>
								<div>
									<h3 className="craft__title">
										{step.title}
									</h3>
									<p className="craft__text">{step.text}</p>
								</div>
							</li>
						))}
					</ol>
				</div>
			</div>
		</section>
	);
}
