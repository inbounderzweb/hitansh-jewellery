import Image from 'next/image';

export default function BrandStory() {
	return (
		<section id="house" className="story" aria-labelledby="story-title">
			<div className="container story__grid">
				<div className="story__text">
					<p className="eyebrow" data-reveal>
						The House of Hitansh
					</p>
					<h2 id="story-title" className="visually-hidden">
						Our philosophy
					</h2>
					<p className="story__statement" data-scrub-words>
						We believe fine jewellery should feel as personal as the
						moment it marks — designed with intention, crafted with
						patience and made to be passed on.
					</p>
					<div className="story__footer" data-reveal>
						<Image
							className="story__monogram"
							src="/brand/hitansh-monogram.png"
							alt=""
							width={444}
							height={510}
						/>
						<p className="lede">
							Every Hitansh piece balances classical proportion
							with a modern sense of light — so it feels as right
							on an ordinary Tuesday as it does on the day it is
							given.
						</p>
						<a className="link" href="#craft">
							Discover our craft
							<svg viewBox="0 0 24 24" fill="none" aria-hidden>
								<path
									d="M5 12h14M13 6l6 6-6 6"
									stroke="currentColor"
									strokeWidth="1.3"
									strokeLinecap="round"
								/>
							</svg>
						</a>
					</div>
				</div>
				<figure className="story__figure">
					<div className="story__media" data-image-reveal>
						<Image
							src="/images/renders/story-atelier.webp"
							alt="A white diamond pear halo ring in white gold, seen through its band"
							width={900}
							height={1300}
							sizes="(max-width: 760px) 90vw, 40vw"
						/>
					</div>
					<figcaption>
						<span>Fig. 01</span> The halo, seen through the band
					</figcaption>
				</figure>
			</div>
		</section>
	);
}
