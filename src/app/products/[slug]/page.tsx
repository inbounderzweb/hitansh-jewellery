import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { craftSteps, jewelleryCare, products, signature } from '@/content/site';
import {
	getCollection,
	getProduct,
	productCategory,
	productImages,
	productPath,
	productSpecs,
	productSummary,
	recommended,
	sameCollection,
} from '@/lib/catalogue';
import ProductGallery from '@/components/catalogue/ProductGallery';
import ProductCard from '@/components/catalogue/ProductCard';
import EnquiryButton from '@/components/catalogue/EnquiryButton';

type Props = { params: Promise<{ slug: string }> };

// Only the products in the catalogue exist; anything else is a 404.
export const dynamicParams = false;

export function generateStaticParams() {
	return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const product = getProduct((await params).slug);
	if (!product) return {};
	const title = `${product.name} — ${product.gemstone} ${product.design} in ${product.metal}`;
	const description = productSummary(product);
	return {
		title,
		description,
		alternates: { canonical: productPath(product.slug) },
		openGraph: {
			type: 'website',
			url: productPath(product.slug),
			title,
			description,
			images: [{ url: product.image, width: 1000, height: 1250 }],
		},
		twitter: { card: 'summary_large_image', title, description },
	};
}

export default async function ProductPage({ params }: Props) {
	const product = getProduct((await params).slug);
	if (!product) notFound();

	const collection = getCollection(product);
	const specs = productSpecs(product);
	const fromCollection = sameCollection(product);
	const alsoLike = recommended(product, fromCollection);
	const enquiryProduct = {
		slug: product.slug,
		name: product.name,
		reference: product.reference,
	};

	const jsonLd = {
		'@context': 'https://schema.org',
		'@type': 'Product',
		name: product.name,
		description: productSummary(product),
		image: productImages(product).map((i) => i.src),
		category: productCategory(product),
		material: product.metal,
		...(product.reference && { sku: product.reference }),
		brand: { '@type': 'Brand', name: 'Hitansh Fine Jewellery' },
	};

	return (
		<>
			<div className="container pdp">
				<nav className="crumbs" aria-label="Breadcrumb">
					<ol>
						<li>
							<Link href="/">Home</Link>
						</li>
						<li>
							<Link href="/products">Catalogue</Link>
						</li>
						<li aria-current="page">{product.name}</li>
					</ol>
				</nav>

				<div className="pdp__grid">
					<ProductGallery
						images={productImages(product)}
						name={product.name}
					/>

					<div className="pdp__info">
						<p className="pdp__kicker">
							{collection ? `${collection.title} · ` : ''}
							{productCategory(product)}
						</p>
						<h1 className="pdp__title">{product.name}</h1>
						<p className="pdp__subtitle">
							{product.gemstone} {product.design} in{' '}
							{product.metal}
						</p>
						{product.reference && (
							<p className="pdp__ref">Ref. {product.reference}</p>
						)}

						<p className="pdp__summary">
							{productSummary(product)}
						</p>

						<div className="pdp__actions" id="enquire">
							<EnquiryButton
								product={enquiryProduct}
								className="btn btn--gold pdp__cta"
							>
								Enquire now
							</EnquiryButton>
							<p className="pdp__assure">
								Price on request · Viewing by appointment
							</p>
						</div>

						<div className="pdp__accordions">
							<details className="acc" open>
								<summary>Details &amp; specifications</summary>
								<dl className="specs-list">
									{specs.map((s) => (
										<div key={s.label}>
											<dt>{s.label}</dt>
											<dd>{s.value}</dd>
										</div>
									))}
								</dl>
							</details>

							<details className="acc">
								<summary>Craftsmanship &amp; materials</summary>
								<div className="acc__body">
									<p>
										A {product.gemstone.toLowerCase()}{' '}
										centre stone, framed by a{' '}
										{signature.specs
											.find((s) => s.label === 'Setting')
											?.value.toLowerCase()}
										, set in {product.metal.toLowerCase()}.
										The design is offered in{' '}
										{signature.specs
											.find((s) => s.label === 'Metals')
											?.value.replaceAll(' · ', ', ')
											.toLowerCase()}
										.
									</p>
									<ol className="acc__steps">
										{craftSteps.map((step) => (
											<li key={step.number}>
												<span>{step.number}</span>
												<div>
													<h3>{step.title}</h3>
													<p>{step.text}</p>
												</div>
											</li>
										))}
									</ol>
								</div>
							</details>

							<details className="acc">
								<summary>Jewellery care</summary>
								<div className="acc__body">
									<ul className="acc__care">
										{jewelleryCare.map((c) => (
											<li key={c.title}>
												<h3>{c.title}</h3>
												<p>{c.text}</p>
											</li>
										))}
									</ul>
								</div>
							</details>
						</div>
					</div>
				</div>

				{fromCollection.length > 0 && collection && (
					<section
						className="pdp-rail"
						aria-labelledby="rail-collection"
					>
						<div className="pdp-rail__head">
							<h2 id="rail-collection">
								More from {collection.title}
							</h2>
						</div>
						<div className="p-grid p-grid--rail">
							{fromCollection.map((p) => (
								<ProductCard key={p.slug} product={p} />
							))}
						</div>
					</section>
				)}

				{alsoLike.length > 0 && (
					<section
						className="pdp-rail"
						aria-labelledby="rail-related"
					>
						<div className="pdp-rail__head">
							<h2 id="rail-related">You may also like</h2>
							<Link className="link" href="/products">
								View all pieces
							</Link>
						</div>
						<div className="p-grid p-grid--rail">
							{alsoLike.map((p) => (
								<ProductCard key={p.slug} product={p} />
							))}
						</div>
					</section>
				)}
			</div>

			{/* Mobile: keep the enquiry action within reach. */}
			<div className="pdp-sticky">
				<div>
					<p className="pdp-sticky__name">{product.name}</p>
					<p className="pdp-sticky__meta">
						{product.gemstone} · {product.metal}
					</p>
				</div>
				<EnquiryButton
					product={enquiryProduct}
					className="btn btn--gold"
				>
					Enquire
				</EnquiryButton>
			</div>

			<script
				type="application/ld+json"
				dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
			/>
		</>
	);
}
