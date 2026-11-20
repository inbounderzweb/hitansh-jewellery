import Image from 'next/image';
import { gallery } from '@/content/site';

// Item 1 (the full-circle composition) stays still so it is never cropped.
const speeds = ['0', '-0.06', '0.08', '-0.1', '0.06'];

export default function Gallery() {
	return (
		<section
			id="gallery"
			className="gallery"
			aria-labelledby="gallery-title"
		>
			<div className="container">
				<div className="section-head">
					<div>
						<p className="eyebrow" data-reveal>
							Editorial
						</p>
						<h2 id="gallery-title" className="display" data-split>
							Light, <em>captured</em>
						</h2>
					</div>
					<p className="lede" data-reveal>
						Studies in fire and colour — every image rendered from
						the very ring you can design in our 3D studio.
					</p>
				</div>
				<div className="gallery__grid">
					{gallery.map((item, i) => (
						<figure
							key={item.src}
							className={`gallery__item gallery__item--${i + 1}`}
						>
							<div className="gallery__media" data-image-reveal>
								<div
									className="gallery__parallax"
									data-speed={speeds[i]}
								>
									<Image
										src={item.src}
										alt={item.alt}
										width={item.width}
										height={item.height}
										sizes="(max-width: 760px) 92vw, 45vw"
									/>
								</div>
							</div>
							<figcaption>
								<span>{String(i + 1).padStart(2, '0')}</span>
								{item.caption}
							</figcaption>
						</figure>
					))}
				</div>
			</div>
		</section>
	);
}
