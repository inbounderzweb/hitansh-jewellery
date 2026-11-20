import Link from 'next/link';
import type { Metadata } from 'next';
import ProductListing from '@/components/catalogue/ProductListing';
import { brand } from '@/content/site';
import { getCatalogue } from '@/lib/data/catalogue';

export const revalidate = 300;

export const metadata: Metadata = {
	title: 'The Catalogue',
	description: `Explore the ${brand.fullName} catalogue: pear halo rings in white and coloured diamonds and rare gemstones. Enquire to arrange a private viewing.`,
	alternates: { canonical: '/products' },
};

export default async function ProductsPage() {
	const { products, collections } = await getCatalogue();
	return (
		<div className="container cat-page">
			<nav className="crumbs" aria-label="Breadcrumb">
				<ol>
					<li>
						<Link href="/">Home</Link>
					</li>
					<li aria-current="page">Catalogue</li>
				</ol>
			</nav>
			<header className="cat-intro">
				<p className="cat-intro__eyebrow">The Pear Halo Edit</p>
				<h1 className="cat-intro__title">The Catalogue</h1>
				<p className="cat-intro__text">
					One silhouette, interpreted in rare stones and precious
					metals. Every piece is available to view by appointment.
				</p>
			</header>
			<ProductListing
				products={products}
				collections={collections}
				headingLevel="h2"
			/>
		</div>
	);
}
