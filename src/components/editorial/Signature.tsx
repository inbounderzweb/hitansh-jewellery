import Image from 'next/image';
import { signature } from '@/content/site';
import ConfigureButton from '../ConfigureButton';

export default function Signature() {
	return (
		<section
			id="signature"
			className="signature"
			aria-labelledby="signature-title"
		>
			<div className="signature__media" data-image-reveal>
				<div className="signature__parallax" data-speed="0.12">
					<Image
						src="/images/renders/signature.webp"
						alt="Emerald pear halo ring in yellow gold, side profile"
						width={1600}
						height={1000}
						sizes="(max-width: 900px) 100vw, 58vw"
					/>
				</div>
			</div>
			<div className="signature__body">
				<p className="eyebrow" data-reveal>
					Signature piece
				</p>
				<h2 id="signature-title" className="display" data-split>
					The Pear <em>Halo</em>
				</h2>
				<p className="lede" data-reveal>
					Our defining silhouette: an elongated pear that flatters the
					hand, haloed in pavé diamonds. Choose any of{' '}
					{signature.gemstoneCount} gemstones in{' '}
					{signature.metalCount} precious metals.
				</p>
				<dl className="specs" data-reveal>
					{signature.specs.map((s) => (
						<div key={s.label} className="specs__row">
							<dt>{s.label}</dt>
							<dd>{s.value}</dd>
						</div>
					))}
				</dl>
				<div className="signature__actions" data-reveal>
					<ConfigureButton>
						Design yours in 3D
						<svg viewBox="0 0 24 24" fill="none" aria-hidden>
							<path
								d="M5 12h14M13 6l6 6-6 6"
								stroke="currentColor"
								strokeWidth="1.3"
								strokeLinecap="round"
							/>
						</svg>
					</ConfigureButton>
					<a className="link" href="#appointment">
						Arrange a private viewing
					</a>
				</div>
			</div>
		</section>
	);
}
