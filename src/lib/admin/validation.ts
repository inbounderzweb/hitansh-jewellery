/**
 * Validation for admin forms, shared by the browser (instant feedback) and
 * the Server Actions (the authority). Image references are additionally
 * checked server-side in `sanitiseImage`.
 */
import { productTags, type ProductCategory, type Spec } from '@/lib/catalogue';
import {
	GEM_OPTIONS,
	HERO_LIMITS,
	METAL_OPTIONS,
	isProductFilter,
} from '@/lib/hero';

export type FieldErrors = Record<string, string>;

export const LIMITS = {
	name: 120,
	slug: 80,
	reference: 40,
	description: 5000,
	short: 120,
	collectionDescription: 600,
	specs: 20,
	specLabel: 60,
	specValue: 200,
	images: 12,
} as const;

export const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const slugify = (text: string) =>
	text
		.normalize('NFKD')
		.replace(/[̀-ͯ]/g, '')
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '')
		.slice(0, LIMITS.slug);

export type ImageInput = {
	url: string;
	publicId?: string;
	width?: number;
	height?: number;
	alt?: string;
};

export type ProductInput = {
	name: string;
	slug: string;
	reference: string;
	description: string;
	category: string;
	design: string;
	gemstone: string;
	metal: string;
	weight: string;
	dimensions: string;
	specs: Spec[];
	tags: ProductCategory[];
	collectionIds: string[];
	images: ImageInput[];
	featured: boolean;
	visible: boolean;
};

export type CollectionInput = {
	title: string;
	slug: string;
	description: string;
	cover: ImageInput | null;
	visible: boolean;
	productIds: string[];
};

const text = (v: unknown, max: number) =>
	typeof v === 'string' ? v.trim().slice(0, max * 2) : '';
const ids = (v: unknown) =>
	Array.isArray(v)
		? [
				...new Set(
					v.filter(
						(x): x is string =>
							typeof x === 'string' && /^[a-f0-9]{24}$/.test(x),
					),
				),
			]
		: [];

/** Coerce untrusted JSON into a ProductInput (validation is separate). */
export function parseProduct(raw: unknown): ProductInput {
	const r = (raw && typeof raw === 'object' ? raw : {}) as Record<
		string,
		unknown
	>;
	const tagIds = new Set<string>(productTags.map((t) => t.id));
	return {
		name: text(r.name, LIMITS.name),
		slug: text(r.slug, LIMITS.slug).toLowerCase(),
		reference: text(r.reference, LIMITS.reference),
		description: text(r.description, LIMITS.description),
		category: text(r.category, LIMITS.short),
		design: text(r.design, LIMITS.short),
		gemstone: text(r.gemstone, LIMITS.short),
		metal: text(r.metal, LIMITS.short),
		weight: text(r.weight, LIMITS.short),
		dimensions: text(r.dimensions, LIMITS.short),
		specs: (Array.isArray(r.specs) ? r.specs : [])
			.slice(0, LIMITS.specs * 2)
			.map((s) => ({
				label: text((s as Spec)?.label, LIMITS.specLabel),
				value: text((s as Spec)?.value, LIMITS.specValue),
			}))
			.filter((s) => s.label || s.value),
		tags: (Array.isArray(r.tags) ? r.tags : []).filter(
			(t): t is ProductCategory => typeof t === 'string' && tagIds.has(t),
		),
		collectionIds: ids(r.collectionIds),
		images: Array.isArray(r.images) ? (r.images as ImageInput[]) : [],
		featured: r.featured === true,
		visible: r.visible === true,
	};
}

export function validateProduct(p: ProductInput): FieldErrors {
	const e: FieldErrors = {};
	if (!p.name) e.name = 'Enter the product name.';
	else if (p.name.length > LIMITS.name)
		e.name = `Keep the name under ${LIMITS.name} characters.`;
	if (!p.slug) e.slug = 'Enter a URL slug.';
	else if (!SLUG.test(p.slug) || p.slug.length > LIMITS.slug)
		e.slug = 'Use lowercase letters, numbers and single hyphens only.';
	if (p.reference.length > LIMITS.reference)
		e.reference = `Keep the reference under ${LIMITS.reference} characters.`;
	if (!p.category) e.category = 'Enter a category, e.g. Rings.';
	if (p.description.length > LIMITS.description)
		e.description = `Keep the description under ${LIMITS.description} characters.`;
	for (const key of [
		'category',
		'design',
		'gemstone',
		'metal',
		'weight',
		'dimensions',
	] as const)
		if (p[key].length > LIMITS.short)
			e[key] = `Keep this under ${LIMITS.short} characters.`;
	if (p.specs.length > LIMITS.specs)
		e.specs = `Add at most ${LIMITS.specs} specifications.`;
	else if (p.specs.some((s) => !s.label || !s.value))
		e.specs = 'Each specification needs both a label and a value.';
	else if (
		p.specs.some(
			(s) =>
				s.label.length > LIMITS.specLabel ||
				s.value.length > LIMITS.specValue,
		)
	)
		e.specs = 'A specification label or value is too long.';
	if (p.images.length > LIMITS.images)
		e.images = `Add at most ${LIMITS.images} images.`;
	else if (p.visible && p.images.length === 0)
		e.images = 'Add at least one image before making the product visible.';
	return e;
}

export function parseCollection(raw: unknown): CollectionInput {
	const r = (raw && typeof raw === 'object' ? raw : {}) as Record<
		string,
		unknown
	>;
	return {
		title: text(r.title, LIMITS.name),
		slug: text(r.slug, LIMITS.slug).toLowerCase(),
		description: text(r.description, LIMITS.collectionDescription),
		cover:
			r.cover && typeof r.cover === 'object'
				? (r.cover as ImageInput)
				: null,
		visible: r.visible === true,
		productIds: ids(r.productIds),
	};
}

export function validateCollection(c: CollectionInput): FieldErrors {
	const e: FieldErrors = {};
	if (!c.title) e.title = 'Enter the collection title.';
	else if (c.title.length > 80)
		e.title = 'Keep the title under 80 characters.';
	if (!c.slug) e.slug = 'Enter a URL slug.';
	else if (!SLUG.test(c.slug) || c.slug.length > LIMITS.slug)
		e.slug = 'Use lowercase letters, numbers and single hyphens only.';
	if (c.description.length > LIMITS.collectionDescription)
		e.description = `Keep the description under ${LIMITS.collectionDescription} characters.`;
	if (c.visible && !c.cover)
		e.cover = 'Add a cover image before making the collection visible.';
	return e;
}

/* ------------------------------------------------------------ Banner rings */

export type BannerRingInput = {
	name: string;
	alt: string;
	image: ImageInput | null;
	glow: string;
	productId: string;
	visible: boolean;
};

export function parseBannerRing(raw: unknown): BannerRingInput {
	const r = (raw && typeof raw === 'object' ? raw : {}) as Record<
		string,
		unknown
	>;
	return {
		name: text(r.name, 60),
		alt: text(r.alt, 200),
		image:
			r.image && typeof r.image === 'object'
				? (r.image as ImageInput)
				: null,
		glow: text(r.glow, 7).toLowerCase(),
		productId:
			typeof r.productId === 'string' &&
			/^[a-f0-9]{24}$/.test(r.productId)
				? r.productId
				: '',
		visible: r.visible === true,
	};
}

export function validateBannerRing(r: BannerRingInput): FieldErrors {
	const e: FieldErrors = {};
	if (!r.name) e.name = 'Enter the ring’s name (shown under the image).';
	else if (r.name.length > 60) e.name = 'Keep the name under 60 characters.';
	if (r.alt.length > 200)
		e.alt = 'Keep the description under 200 characters.';
	if (!r.image) e.image = 'Upload the ring image.';
	if (!/^#[0-9a-f]{6}$/.test(r.glow)) e.glow = 'Choose a glow colour.';
	return e;
}

/* ------------------------------------------------------------- Hero slides */

export type HeroSlideInput = {
	name: string;
	collection: string;
	description: string;
	gem: string;
	metal: string;
	filterTarget: string;
	glow: string;
	visible: boolean;
};

export function parseHeroSlide(raw: unknown): HeroSlideInput {
	const r = (raw && typeof raw === 'object' ? raw : {}) as Record<
		string,
		unknown
	>;
	return {
		name: text(r.name, HERO_LIMITS.name + 1),
		collection: text(r.collection, HERO_LIMITS.collection + 1),
		description: text(r.description, HERO_LIMITS.description + 1),
		gem: text(r.gem, 40),
		metal: text(r.metal, 40),
		filterTarget: text(r.filterTarget, 100),
		glow: text(r.glow, 7).toLowerCase(),
		visible: r.visible === true,
	};
}

export function validateHeroSlide(s: HeroSlideInput): FieldErrors {
	const e: FieldErrors = {};
	if (!s.name) e.name = 'Enter the ring’s name.';
	else if (s.name.length > HERO_LIMITS.name)
		e.name = `Keep the name under ${HERO_LIMITS.name} characters.`;
	if (s.collection.length > HERO_LIMITS.collection)
		e.collection = `Keep this under ${HERO_LIMITS.collection} characters.`;
	if (!s.description) e.description = 'Add a short description.';
	else if (s.description.length > HERO_LIMITS.description)
		e.description = `Keep the description under ${HERO_LIMITS.description} characters.`;
	if (!GEM_OPTIONS.some((g) => g.value === s.gem))
		e.gem = 'Choose a gemstone.';
	if (!METAL_OPTIONS.some((m) => m.value === s.metal))
		e.metal = 'Choose a metal.';
	if (
		!isProductFilter(s.filterTarget) &&
		!/^collection:[a-z0-9]+(?:-[a-z0-9]+)*$/.test(s.filterTarget)
	)
		e.filterTarget = 'Choose what the Explore button shows.';
	if (!/^#[0-9a-f]{6}$/.test(s.glow)) e.glow = 'Choose a glow colour.';
	return e;
}
