import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { craftSteps, jewelleryCare, signature } from '@/content/site';
import {
	getCollection,
	productImages,
	productMeta,
	productPath,
	productSpecs,
	productSubtitle,
	recommended,
	sameCollection,
	type Product,
} from '@/lib/catalogue';
import { getCatalogue, getPublicProduct } from '@/lib/data/catalogue';
import ProductGallery from '@/components/catalogue/ProductGallery';
import ProductCard from '@/components/catalogue/ProductCard';
import EnquiryButton from '@/components/catalogue/EnquiryButton';

type Props = { params: Promise<{ slug: string }> };

// Pieces added later are rendered on first visit, then cached. Unknown or
// hidden slugs are a 404 (see `notFound()` below).
export const revalidate = 300;

export async function generateStaticParams() {
	const { products } = await getCatalogue();
	return products.map((p) => ({ slug: p.slug }));
}

/** Plain-text summary for meta tags: the first paragraph of the description. */
const summary = (p: Product) =>
	p.description.split(/\n\s*\n/)[0]?.trim() || productSubtitle(p) || p.name;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const { product } = await getPublicProduct((await params).slug);
	if (!product) return {};
	const subtitle = productSubtitle(product);
	const title = subtitle ? `${product.name} — ${subtitle}` : product.name;
	const description = summary(product);
	const image = product.images[0];
	return {
		title,
		description,
		alternates: { canonical: productPath(product.slug) },
		openGraph: {
			type: 'website',
			url: productPath(product.slug),
			title,
			description,
			...(image && {
				images: [
					{
						url: image.url,
						width: image.width ?? 1000,
						height: image.height ?? 1250,
					},
				],
			}),
		},
		twitter: { card: 'summary_large_image', title, description },
	};
}

export default async function ProductPage({ params }: Props) {
	const { product, catalogue } = await getPublicProduct((await params).slug);
	if (!product) notFound();

	const { products, collections } = catalogue;
	const collection = getCollection(product, collections);
	const specs = productSpecs(product, collection);
	const fromCollection = sameCollection(product, products, collection);
	const alsoLike = recommended(product, products, fromCollection);
	const images = productImages(product);
	const subtitle = productSubtitle(product);
	const meta = productMeta(product);
	const setting = product.specs.find((s) => s.label === 'Setting')?.value;
	const paragraphs = product.description
		.split(/\n\s*\n/)
		.map((t) => t.trim())
		.filter(Boolean);
	const enquiryProduct = {
		slug: product.slug,
		name: product.name,
		reference: product.reference,
	};

	const jsonLd = {
		'@context': 'https://schema.org',
		'@type': 'Product',
		name: product.name,
		description: summary(product),
		image: images.map((i) => i.url),
		category: product.category,
		...(product.metal && { material: product.metal }),
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
					{images.length > 0 && (
						<ProductGallery images={images} name={product.name} />
					)}

					<div className="pdp__info">
						<p className="pdp__kicker">
							{[collection?.title, product.category]
								.filter(Boolean)
								.join(' · ')}
						</p>
						<h1 className="pdp__title">{product.name}</h1>
						{subtitle && (
							<p className="pdp__subtitle">{subtitle}</p>
						)}
						{product.reference && (
							<p className="pdp__ref">Ref. {product.reference}</p>
						)}

						{paragraphs.map((text, i) => (
							<p key={i} className="pdp__summary">
								{text}
							</p>
						))}

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
									{product.gemstone && product.metal && (
										<p>
											A {product.gemstone.toLowerCase()}{' '}
											centre stone
											{setting
												? `, framed by a ${setting.toLowerCase()}`
												: ''}
											, set in{' '}
											{product.metal.toLowerCase()}.
											{product.design ===
												'Pear Halo Ring' &&
												` The design is offered in ${signature.specs
													.find(
														(s) =>
															s.label ===
															'Metals',
													)
													?.value.replaceAll(
														' · ',
														', ',
													)
													.toLowerCase()}.`}
										</p>
									)}
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
								<ProductCard
									key={p.slug}
									product={p}
									collection={getCollection(p, collections)}
								/>
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
								<ProductCard
									key={p.slug}
									product={p}
									collection={getCollection(p, collections)}
								/>
							))}
						</div>
					</section>
				)}
			</div>

			{/* Mobile: keep the enquiry action within reach. */}
			<div className="pdp-sticky">
				<div>
					<p className="pdp-sticky__name">{product.name}</p>
					{meta && <p className="pdp-sticky__meta">{meta}</p>}
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
