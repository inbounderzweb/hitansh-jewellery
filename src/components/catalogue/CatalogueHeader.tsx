import Image from 'next/image';
import Link from 'next/link';
import EnquiryButton from './EnquiryButton';

/**
 * Static header for catalogue pages (`/products`, `/products/[slug]`).
 * Navigation is client-side: the home page's 3D viewer shuts itself down on
 * unmount and restarts on return (see WebgiViewer).
 */
export default function CatalogueHeader() {
	return (
		<header className="cat-header">
			<div className="cat-header__bar container">
				<nav className="cat-header__nav" aria-label="Primary">
					<Link href="/">Home</Link>
					<Link href="/products">Catalogue</Link>
				</nav>
				<Link
					className="cat-header__brand"
					href="/"
					aria-label="Hitansh Fine Jewellery — home"
				>
					<Image
						src="/brand/hitansh-wordmark.png"
						alt="Hitansh"
						width={1204}
						height={206}
						priority
					/>
				</Link>
				<div className="cat-header__actions">
					<EnquiryButton className="cat-header__cta">
						Book a consultation
					</EnquiryButton>
				</div>
			</div>
		</header>
	);
}
