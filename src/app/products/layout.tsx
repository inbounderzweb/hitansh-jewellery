import CatalogueHeader from '@/components/catalogue/CatalogueHeader';
import SiteFooter from '@/components/SiteFooter';

/** Shared chrome for the catalogue (`/products` and `/products/[slug]`). */
export default function CatalogueLayout({
	children,
}: Readonly<{ children: React.ReactNode }>) {
	return (
		<div className="catalogue">
			<CatalogueHeader />
			<main id="main-content">{children}</main>
			<SiteFooter basePath="/" />
		</div>
	);
}
