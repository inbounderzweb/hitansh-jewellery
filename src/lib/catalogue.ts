/**
 * Catalogue helpers built on the product data in `@/content/site`.
 *
 * Everything here is derived from existing product fields; no specification
 * is invented. Facts shared by every piece (setting, band) come from the
 * `signature.specs` of the single pear halo design.
 */
import {
	collections,
	productFilters,
	products,
	signature,
	type Product,
	type ProductCategory,
} from '@/content/site';

export type Collection = (typeof collections)[number];

export const productPath = (slug: string) => `/products/${slug}`;

export function getProduct(slug: string): Product | undefined {
	return products.find((p) => p.slug === slug);
}

/** The first editorial collection whose filter matches the product. */
export function getCollection(product: Product): Collection | undefined {
	return collections.find((c) => product.categories.includes(c.filter));
}

/** Catalogue category. All current pieces share one design: a ring. */
export const productCategory = (product: Product) =>
	product.design.toLowerCase().includes('ring') ? 'Rings' : product.design;

export const categoryLabel = (id: ProductCategory) =>
	productFilters.find((f) => f.id === id)?.label ?? id;

export type GalleryImage = { src: string; alt: string };

export function productImages(product: Product): GalleryImage[] {
	const subject = `${product.name} ${product.design.toLowerCase()} — ${product.gemstone} in ${product.metal}`;
	return [
		{ src: product.image, alt: `${subject}, viewed from above` },
		{
			src: product.detailImage,
			alt: `${subject}, close-up of the centre stone and halo`,
		},
	];
}

const spec = (label: string) =>
	signature.specs.find((s) => s.label === label)?.value;

/** Specification rows, using only data that exists for this product. */
export function productSpecs(product: Product) {
	const collection = getCollection(product);
	return [
		{ label: 'Design', value: product.design },
		{
			label: 'Centre stone',
			value: `${spec('Centre stone')} ${product.gemstone}`,
		},
		{ label: 'Setting', value: spec('Setting') },
		{ label: 'Band', value: spec('Band') },
		{ label: 'Metal', value: product.metal },
		{ label: 'Collection', value: collection?.title },
		{ label: 'Reference', value: product.reference },
	].filter((row): row is { label: string; value: string } => !!row.value);
}

/** A one-paragraph summary composed strictly from the product's attributes. */
export function productSummary(product: Product) {
	return `${product.name} sets a ${spec('Centre stone')?.toLowerCase()} ${product.gemstone.toLowerCase()} within a ${spec('Setting')?.toLowerCase()}, carried on a ${product.metal.toLowerCase()} band with ${spec('Band')?.toLowerCase()}.`;
}

/** Other pieces from the same collection. */
export function sameCollection(product: Product, limit = 4): Product[] {
	const collection = getCollection(product);
	if (!collection) return [];
	return products
		.filter(
			(p) =>
				p.slug !== product.slug &&
				getCollection(p)?.id === collection.id,
		)
		.slice(0, limit);
}

/**
 * Recommendations: pieces sharing the most categories (stone family or metal),
 * excluding the product itself and anything already listed in `exclude`.
 */
export function recommended(
	product: Product,
	exclude: Product[] = [],
	limit = 4,
): Product[] {
	const skip = new Set([product.slug, ...exclude.map((p) => p.slug)]);
	return products
		.filter((p) => !skip.has(p.slug))
		.map((p, index) => ({
			p,
			index,
			score: p.categories.filter((c) => product.categories.includes(c))
				.length,
		}))
		.sort((a, b) => b.score - a.score || a.index - b.index)
		.slice(0, limit)
		.map(({ p }) => p);
}
