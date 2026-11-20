import Link from 'next/link';
import CatalogueHeader from '@/components/catalogue/CatalogueHeader';

export default function NotFound() {
	return (
		<div className="catalogue">
			<CatalogueHeader />
			<main id="main-content" className="container cat-page">
				<div className="cat-intro">
					<p className="cat-intro__eyebrow">Page not found</p>
					<h1 className="cat-intro__title">This piece is not here</h1>
					<p className="cat-intro__text">
						The page you are looking for may have moved. Explore the
						full catalogue instead.
					</p>
					<p style={{ marginTop: '2rem' }}>
						<Link className="btn btn--outline" href="/products">
							View the catalogue
						</Link>
					</p>
				</div>
			</main>
		</div>
	);
}
