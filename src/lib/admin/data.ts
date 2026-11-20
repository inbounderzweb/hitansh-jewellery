import 'server-only';
import { ObjectId, type Filter } from 'mongodb';
import { collections as db } from '@/lib/db/mongo';
import { requireAdmin } from '@/lib/auth/session';
import {
	ENQUIRY_STATUSES,
	type EnquiryDoc,
	type EnquiryStatus,
} from '@/lib/db/types';
import type { ImageAsset, ProductCategory, Spec } from '@/lib/catalogue';
import { staticHeroSlides, type HeroMode } from '@/lib/hero';
import {
	DEFAULT_MAKING_HEADING,
	DEFAULT_MAKING_STAGES,
	makingEyebrow,
	type MakingSource,
} from '@/lib/making';

/**
 * Read models for the admin pages. Every function checks the session itself:
 * Next.js renders a page in parallel with its layout, so the layout's check
 * alone would not stop a page's data from being streamed. `requireAdmin` is
 * memoised per request, so the repeated calls are free.
 *
 * Everything returned is plain, serialisable data for Client Components.
 */

const oid = (id: string) =>
	ObjectId.isValid(id) && id.length === 24 ? new ObjectId(id) : null;

export async function isInitialised() {
	await requireAdmin();
	const { meta } = await db();
	return !!(await meta.findOne({ _id: 'catalogue' }));
}

export type AdminProductRow = {
	id: string;
	name: string;
	slug: string;
	reference?: string;
	category: string;
	thumb?: string;
	collections: string[];
	visible: boolean;
	featured: boolean;
	updatedAt: string;
};

export type AdminCollectionRow = {
	id: string;
	title: string;
	slug: string;
	description: string;
	thumb?: string;
	visible: boolean;
	productCount: number;
};

export async function listCollections(): Promise<AdminCollectionRow[]> {
	await requireAdmin();
	const { collections, products } = await db();
	const [docs, counts] = await Promise.all([
		collections.find().sort({ position: 1, createdAt: 1 }).toArray(),
		products
			.aggregate<{ _id: ObjectId; n: number }>([
				{ $unwind: '$collectionIds' },
				{ $group: { _id: '$collectionIds', n: { $sum: 1 } } },
			])
			.toArray(),
	]);
	const countById = new Map(counts.map((c) => [c._id.toHexString(), c.n]));
	return docs.map((c) => ({
		id: c._id.toHexString(),
		title: c.title,
		slug: c.slug,
		description: c.description,
		thumb: c.cover?.url,
		visible: c.visible,
		productCount: countById.get(c._id.toHexString()) ?? 0,
	}));
}

export async function listProducts(): Promise<AdminProductRow[]> {
	await requireAdmin();
	const { products, collections } = await db();
	const [docs, cols] = await Promise.all([
		products.find().sort({ position: 1, createdAt: 1 }).toArray(),
		collections.find({}, { projection: { title: 1 } }).toArray(),
	]);
	const titleById = new Map(cols.map((c) => [c._id.toHexString(), c.title]));
	return docs.map((p) => ({
		id: p._id.toHexString(),
		name: p.name,
		slug: p.slug,
		...(p.reference && { reference: p.reference }),
		category: p.category,
		thumb: p.images?.[0]?.url,
		collections: (p.collectionIds ?? [])
			.map((id) => titleById.get(id.toHexString()))
			.filter((t): t is string => !!t),
		visible: p.visible,
		featured: p.featured,
		updatedAt: p.updatedAt.toISOString(),
	}));
}

export type ProductFormValues = {
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
	images: ImageAsset[];
	featured: boolean;
	visible: boolean;
};

export async function getProductForm(
	id: string,
): Promise<ProductFormValues | null> {
	await requireAdmin();
	const _id = oid(id);
	if (!_id) return null;
	const { products } = await db();
	const p = await products.findOne({ _id });
	if (!p) return null;
	return {
		name: p.name,
		slug: p.slug,
		reference: p.reference ?? '',
		description: p.description ?? '',
		category: p.category ?? '',
		design: p.design ?? '',
		gemstone: p.gemstone ?? '',
		metal: p.metal ?? '',
		weight: p.weight ?? '',
		dimensions: p.dimensions ?? '',
		specs: p.specs ?? [],
		tags: p.tags ?? [],
		collectionIds: (p.collectionIds ?? []).map((c) => c.toHexString()),
		images: (p.images ?? []).map((i) => ({ ...i })),
		featured: p.featured,
		visible: p.visible,
	};
}

export type CollectionFormValues = {
	title: string;
	slug: string;
	description: string;
	cover: ImageAsset | null;
	visible: boolean;
	productIds: string[];
};

export async function getCollectionForm(
	id: string,
): Promise<CollectionFormValues | null> {
	await requireAdmin();
	const _id = oid(id);
	if (!_id) return null;
	const { collections, products } = await db();
	const c = await collections.findOne({ _id });
	if (!c) return null;
	const members = await products
		.find({ collectionIds: _id }, { projection: { _id: 1 } })
		.toArray();
	return {
		title: c.title,
		slug: c.slug,
		description: c.description,
		cover: c.cover ? { ...c.cover } : null,
		visible: c.visible,
		productIds: members.map((m) => m._id.toHexString()),
	};
}

export type EnquiryRow = {
	id: string;
	name: string;
	email: string;
	phone: string;
	message: string;
	product: EnquiryDoc['product'];
	status: EnquiryStatus;
	notes: string;
	createdAt: string;
};

const toEnquiryRow = (e: EnquiryDoc): EnquiryRow => ({
	id: e._id.toHexString(),
	name: e.name,
	email: e.email,
	phone: e.phone,
	message: e.message,
	product: e.product ?? null,
	status: e.status,
	notes: e.notes ?? '',
	createdAt: e.createdAt.toISOString(),
});

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const ENQUIRY_PAGE_SIZE = 25;

export async function listEnquiries({
	q = '',
	status = '',
	page = 1,
}: {
	q?: string;
	status?: string;
	page?: number;
}) {
	await requireAdmin();
	const { enquiries } = await db();
	const filter: Filter<EnquiryDoc> = {};
	if ((ENQUIRY_STATUSES as readonly string[]).includes(status))
		filter.status = status as EnquiryStatus;
	const term = q.trim().slice(0, 100);
	if (term) {
		const rx = new RegExp(escapeRegex(term), 'i');
		filter.$or = [
			{ name: rx },
			{ email: rx },
			{ phone: rx },
			{ message: rx },
			{ 'product.name': rx },
			{ 'product.reference': rx },
		];
	}
	const current = Math.max(1, Math.floor(page) || 1);
	const [total, docs] = await Promise.all([
		enquiries.countDocuments(filter),
		enquiries
			.find(filter)
			.sort({ createdAt: -1 })
			.skip((current - 1) * ENQUIRY_PAGE_SIZE)
			.limit(ENQUIRY_PAGE_SIZE)
			.toArray(),
	]);
	return {
		total,
		page: current,
		pages: Math.max(1, Math.ceil(total / ENQUIRY_PAGE_SIZE)),
		rows: docs.map(toEnquiryRow),
	};
}

export async function getEnquiry(id: string) {
	await requireAdmin();
	const _id = oid(id);
	if (!_id) return null;
	const { enquiries } = await db();
	const e = await enquiries.findOne({ _id });
	return e ? toEnquiryRow(e) : null;
}

export async function dashboardStats() {
	await requireAdmin();
	const { products, collections, enquiries } = await db();
	const [
		productCount,
		visibleProducts,
		collectionCount,
		newEnquiries,
		recentProducts,
		recentEnquiries,
	] = await Promise.all([
		products.countDocuments(),
		products.countDocuments({ visible: true }),
		collections.countDocuments(),
		enquiries.countDocuments({ status: 'new' }),
		products
			.find(
				{},
				{
					projection: {
						name: 1,
						images: { $slice: 1 },
						createdAt: 1,
						visible: 1,
						category: 1,
					},
				},
			)
			.sort({ createdAt: -1 })
			.limit(5)
			.toArray(),
		enquiries.find().sort({ createdAt: -1 }).limit(5).toArray(),
	]);
	return {
		productCount,
		visibleProducts,
		collectionCount,
		newEnquiries,
		recentProducts: recentProducts.map((p) => ({
			id: p._id.toHexString(),
			name: p.name,
			category: p.category,
			thumb: p.images?.[0]?.url,
			visible: p.visible,
			createdAt: p.createdAt.toISOString(),
		})),
		recentEnquiries: recentEnquiries.map(toEnquiryRow),
	};
}

export async function productOptions() {
	await requireAdmin();
	const { products } = await db();
	const docs = await products
		.find(
			{},
			{ projection: { name: 1, reference: 1, images: { $slice: 1 } } },
		)
		.sort({ position: 1, createdAt: 1 })
		.toArray();
	return docs.map((p) => ({
		id: p._id.toHexString(),
		name: p.name,
		reference: p.reference,
		thumb: p.images?.[0]?.url,
	}));
}

export async function collectionOptions() {
	await requireAdmin();
	const { collections } = await db();
	const docs = await collections
		.find({}, { projection: { title: 1 } })
		.sort({ position: 1, createdAt: 1 })
		.toArray();
	return docs.map((c) => ({ id: c._id.toHexString(), title: c.title }));
}

/* ------------------------------------------------------------ Banner rings */

export async function isBannerInitialised() {
	await requireAdmin();
	const { meta } = await db();
	return !!(await meta.findOne({ _id: 'banner' }));
}

export type BannerRingRow = {
	id: string;
	name: string;
	thumb: string;
	glow: string;
	product?: string;
	visible: boolean;
};

export async function listBannerRings(): Promise<BannerRingRow[]> {
	await requireAdmin();
	const { bannerRings, products } = await db();
	const rings = await bannerRings
		.find()
		.sort({ position: 1, createdAt: 1 })
		.toArray();
	const linked = await products
		.find(
			{
				_id: {
					$in: rings.flatMap((r) =>
						r.productId ? [r.productId] : [],
					),
				},
			},
			{ projection: { name: 1 } },
		)
		.toArray();
	const nameById = new Map(linked.map((p) => [p._id.toHexString(), p.name]));
	return rings.map((r) => ({
		id: r._id.toHexString(),
		name: r.name,
		thumb: r.image.url,
		glow: r.glow,
		product: r.productId
			? nameById.get(r.productId.toHexString())
			: undefined,
		visible: r.visible,
	}));
}

export type BannerRingFormValues = {
	name: string;
	alt: string;
	image: ImageAsset | null;
	glow: string;
	productId: string;
	visible: boolean;
};

export async function getBannerRingForm(
	id: string,
): Promise<BannerRingFormValues | null> {
	await requireAdmin();
	const _id = oid(id);
	if (!_id) return null;
	const { bannerRings } = await db();
	const r = await bannerRings.findOne({ _id });
	if (!r) return null;
	return {
		name: r.name,
		alt: r.alt,
		image: { ...r.image },
		glow: r.glow,
		productId: r.productId?.toHexString() ?? '',
		visible: r.visible,
	};
}

/* ------------------------------------------------------------- Hero slides */

export async function isHeroInitialised() {
	await requireAdmin();
	const { meta } = await db();
	return !!(await meta.findOne({ _id: 'hero' }));
}

export type HeroSlideFormValues = {
	name: string;
	collection: string;
	description: string;
	gem: string;
	metal: string;
	filterTarget: string;
	glow: string;
	mode: HeroMode;
	photos: ImageAsset[];
	spin: ImageAsset[];
	visible: boolean;
};

export type HeroSlideRow = HeroSlideFormValues & { id: string };

export async function listHeroSlides(): Promise<HeroSlideRow[]> {
	await requireAdmin();
	const { heroSlides } = await db();
	const slides = await heroSlides
		.find()
		.sort({ position: 1, createdAt: 1 })
		.toArray();
	return slides.map((s) => ({
		id: s._id.toHexString(),
		name: s.name,
		collection: s.collection,
		description: s.description,
		gem: s.gem,
		metal: s.metal,
		filterTarget: s.filterTarget,
		glow: s.glow,
		mode: s.mode ?? '3d',
		photos: (s.photos ?? []).map((p) => ({ ...p })),
		spin: (s.spin ?? []).map((f) => ({ ...f })),
		visible: s.visible,
	}));
}

export async function getHeroSlideForm(
	id: string,
): Promise<HeroSlideFormValues | null> {
	await requireAdmin();
	const _id = oid(id);
	if (!_id) return null;
	const { heroSlides } = await db();
	const s = await heroSlides.findOne({ _id });
	if (!s) return null;
	return {
		name: s.name,
		collection: s.collection,
		description: s.description,
		gem: s.gem,
		metal: s.metal,
		filterTarget: s.filterTarget,
		glow: s.glow,
		mode: s.mode ?? '3d',
		photos: (s.photos ?? []).map((p) => ({ ...p })),
		spin: (s.spin ?? []).map((f) => ({ ...f })),
		visible: s.visible,
	};
}

/** Collections the hero's Explore button can open (slug + title). */
export async function exploreCollectionOptions() {
	await requireAdmin();
	const { collections } = await db();
	const docs = await collections
		.find({}, { projection: { slug: 1, title: 1, visible: 1 } })
		.sort({ position: 1 })
		.toArray();
	return docs.map((c) => ({
		slug: c.slug,
		title: c.title,
		visible: c.visible,
	}));
}

/* --------------------------------------------------------- Making section */

export type MakingFormValues = {
	visible: boolean;
	eyebrow: string;
	heading: string;
	stages: string[];
	source: MakingSource;
	spin: ImageAsset[];
};

/**
 * The Making section's settings (the built-in defaults until first saved),
 * plus the 3D banner ring it falls back to.
 */
export async function getMakingForm(): Promise<{
	values: MakingFormValues;
	saved: boolean;
	banner: { name: string; frames: ImageAsset[] } | null;
}> {
	await requireAdmin();
	const { homeSections, heroSlides } = await db();
	const [doc, slide] = await Promise.all([
		homeSections.findOne({ _id: 'making' }),
		heroSlides
			.find({ visible: true, 'spin.0': { $exists: true } })
			.sort({ position: 1, createdAt: 1 })
			.limit(1)
			.next(),
	]);
	const builtIn = staticHeroSlides().find((s) => s.spin?.length);
	const banner = slide
		? {
				name: slide.name,
				frames: (slide.spin ?? []).map(({ url, publicId }) => ({
					url,
					...(publicId && { publicId }),
				})),
			}
		: builtIn
			? {
					name: builtIn.name,
					frames: (builtIn.spin ?? []).map((url) => ({ url })),
				}
			: null;
	const values: MakingFormValues = doc
		? {
				visible: doc.visible,
				eyebrow: doc.eyebrow,
				heading: doc.heading,
				stages: DEFAULT_MAKING_STAGES.map((d, i) => doc.stages[i] ?? d),
				source: doc.source,
				spin: (doc.spin ?? []).map(({ url, publicId }) => ({
					url,
					...(publicId && { publicId }),
				})),
			}
		: {
				visible: true,
				eyebrow: makingEyebrow(banner?.name ?? ''),
				heading: DEFAULT_MAKING_HEADING,
				stages: [...DEFAULT_MAKING_STAGES],
				source: 'banner',
				spin: [],
			};
	return { values, saved: !!doc, banner };
}
