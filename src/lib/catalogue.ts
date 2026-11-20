/**
 * Catalogue types and pure helpers, safe to use on the server and in the
 * browser. Data comes from MongoDB through `@/lib/data/catalogue`; until the
 * starter catalogue has been imported (Admin → Dashboard), the built-in
 * pieces in `@/content/site` are used instead (see `staticCatalogue`).
 */
import {
	collections as siteCollections,
	productFilters,
	products as siteProducts,
	signature,
	type ProductCategory,
} from '@/content/site';

export type { ProductCategory };

export type ImageAsset = {
	url: string;
	/** Cloudinary public ID; absent for images bundled with the site. */
	publicId?: string;
	width?: number;
	height?: number;
	alt?: string;
};

export type Spec = { label: string; value: string };

export type Product = {
	id: string;
	slug: string;
	name: string;
	reference?: string;
	description: string;
	/** Catalogue category shown on cards, e.g. "Rings". */
	category: string;
	/** Design / silhouette, e.g. "Pear Halo Ring". */
	design?: string;
	gemstone?: string;
	metal?: string;
	weight?: string;
	dimensions?: string;
	/** Further attributes (setting, band, carat…) in display order. */
	specs: Spec[];
	/** Filter tags used by the listing's filter bar. */
	tags: ProductCategory[];
	/** Slugs of the (visible) collections the piece belongs to. */
	collections: string[];
	/** First image is the primary image. */
	images: ImageAsset[];
	featured: boolean;
};

export type Collection = {
	id: string;
	slug: string;
	/** Display number, e.g. "01". */
	index: string;
	title: string;
	description: string;
	cover?: ImageAsset;
};

export type Catalogue = { products: Product[]; collections: Collection[] };

export const productTags = productFilters.filter(
	(f): f is { id: ProductCategory; label: string } => f.id !== 'all',
);

export const productPath = (slug: string) => `/products/${slug}`;

/** The first collection the product belongs to. */
export function getCollection(product: Product, collections: Collection[]) {
	return collections.find((c) => product.collections.includes(c.slug));
}

/** "Ruby · Rose Gold" style summary line. */
export const productMeta = (p: Product) =>
	[p.gemstone, p.metal].filter(Boolean).join(' · ');

/** "Ruby Pear Halo Ring in Rose Gold" style subtitle. */
export function productSubtitle(p: Product) {
	const what = [p.gemstone, p.design].filter(Boolean).join(' ');
	if (what && p.metal) return `${what} in ${p.metal}`;
	return what || p.metal || '';
}

export function productImages(
	product: Product,
): Required<Pick<ImageAsset, 'url' | 'alt'>>[] {
	const subject = [product.name, productSubtitle(product)]
		.filter(Boolean)
		.join(' — ');
	return product.images.map((img, i) => ({
		url: img.url,
		alt: img.alt || (i === 0 ? subject : `${subject}, view ${i + 1}`),
	}));
}

/** Specification rows, using only data that exists for this product. */
export function productSpecs(product: Product, collection?: Collection) {
	const rows: { label: string; value: string | undefined }[] = [
		{ label: 'Design', value: product.design },
		{ label: 'Gemstone', value: product.gemstone },
		{ label: 'Metal', value: product.metal },
		{ label: 'Weight', value: product.weight },
		{ label: 'Dimensions', value: product.dimensions },
		...product.specs,
		{ label: 'Collection', value: collection?.title },
		{ label: 'Reference', value: product.reference },
	];
	return rows.filter((row): row is Spec => !!row.value);
}

/** Other pieces from the same collection. */
export function sameCollection(
	product: Product,
	all: Product[],
	collection: Collection | undefined,
	limit = 4,
): Product[] {
	if (!collection) return [];
	return all
		.filter(
			(p) =>
				p.slug !== product.slug &&
				p.collections.includes(collection.slug),
		)
		.slice(0, limit);
}

/**
 * Recommendations: pieces sharing the most filter tags (stone family or
 * metal), excluding the product itself and anything listed in `exclude`.
 */
export function recommended(
	product: Product,
	all: Product[],
	exclude: Product[] = [],
	limit = 4,
): Product[] {
	const skip = new Set([product.slug, ...exclude.map((p) => p.slug)]);
	return all
		.filter((p) => !skip.has(p.slug))
		.map((p, index) => ({
			p,
			index,
			score: p.tags.filter((c) => product.tags.includes(c)).length,
		}))
		.sort((a, b) => b.score - a.score || a.index - b.index)
		.slice(0, limit)
		.map(({ p }) => p);
}

export const displayIndex = (i: number) => String(i + 1).padStart(2, '0');

/* -------------------------------------------------------------------------- */
/* Built-in catalogue (also the source of the one-off import)                  */
/* -------------------------------------------------------------------------- */

const signatureSpec = (label: string) =>
	signature.specs.find((s) => s.label === label)?.value ?? '';

/** The pieces bundled with the site, in the shape the catalogue uses. */
export function staticCatalogue(): Catalogue {
	const collections: Collection[] = siteCollections.map((c, i) => ({
		id: c.id,
		slug: c.id,
		index: displayIndex(i),
		title: c.title,
		description: c.description,
		cover: { url: c.image },
	}));

	const products: Product[] = siteProducts.map((p) => {
		// A piece belongs to every collection whose theme it matches (as the
		// original filter-based collections did); cards show the first one.
		const memberOf = siteCollections
			.filter((c) => p.categories.includes(c.filter))
			.map((c) => c.id);
		const subject = `${p.name} ${p.design.toLowerCase()} — ${p.gemstone} in ${p.metal}`;
		return {
			id: p.slug,
			slug: p.slug,
			name: p.name,
			reference: p.reference,
			description: `${p.name} sets a ${signatureSpec('Centre stone').toLowerCase()} ${p.gemstone.toLowerCase()} within a ${signatureSpec('Setting').toLowerCase()}, carried on a ${p.metal.toLowerCase()} band with ${signatureSpec('Band').toLowerCase()}.`,
			category: 'Rings',
			design: p.design,
			gemstone: p.gemstone,
			metal: p.metal,
			specs: [
				{
					label: 'Centre stone',
					value: `${signatureSpec('Centre stone')} ${p.gemstone}`,
				},
				{ label: 'Setting', value: signatureSpec('Setting') },
				{ label: 'Band', value: signatureSpec('Band') },
			],
			tags: p.categories,
			collections: memberOf,
			images: [
				{ url: p.image, alt: `${subject}, viewed from above` },
				{
					url: p.detailImage,
					alt: `${subject}, close-up of the centre stone and halo`,
				},
			],
			featured: true,
		};
	});

	return { products, collections };
}
