import Link from 'next/link';
import ProductListing from '@/components/catalogue/ProductListing';

/** Home page product listing (`#showcase`). */
export default function ProductShowcase() {
	return (
		<section
			id="showcase"
			className="showcase"
			aria-labelledby="showcase-title"
		>
			<div className="container">
				<div className="section-head">
					<div>
						<p className="eyebrow" data-reveal>
							The Pear Halo Edit
						</p>
						<h2 id="showcase-title" className="display" data-split>
							Signature <em>pieces</em>
						</h2>
					</div>
					<Link className="link" href="/products" data-reveal>
						View the full catalogue
					</Link>
				</div>
				<ProductListing />
			</div>
		</section>
	);
}
