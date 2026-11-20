import Image from 'next/image';
import { social, socialImages } from '@/content/site';

export default function SocialFeed() {
	return (
		<section id="social" className="social" aria-labelledby="social-title">
			<div className="container">
				<div className="section-head">
					<div>
						<p className="eyebrow" data-reveal>
							{social.instagramHandle}
						</p>
						<h2 id="social-title" className="display" data-split>
							Follow the <em>sparkle</em>
						</h2>
					</div>
					<a
						className="btn btn--outline"
						href={social.instagramUrl}
						target="_blank"
						rel="noreferrer"
						data-reveal
					>
						Follow on Instagram
					</a>
				</div>
				<ul className="social__grid">
					{socialImages.map((img, i) => (
						<li
							key={img.src}
							data-reveal
							style={{ '--i': i } as React.CSSProperties}
						>
							<a
								className="social__tile"
								href={social.instagramUrl}
								target="_blank"
								rel="noreferrer"
								aria-label={`${img.alt} — view on Instagram`}
							>
								<Image
									src={img.src}
									alt=""
									width={1000}
									height={1000}
									sizes="(max-width: 760px) 33vw, 16vw"
								/>
								<span className="social__overlay" aria-hidden>
									<svg viewBox="0 0 24 24">
										<rect
											x="3"
											y="3"
											width="18"
											height="18"
											rx="5"
										/>
										<circle cx="12" cy="12" r="4" />
										<circle cx="17.5" cy="6.5" r="0.8" />
									</svg>
								</span>
							</a>
						</li>
					))}
				</ul>
			</div>
		</section>
	);
}
