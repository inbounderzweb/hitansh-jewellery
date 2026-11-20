import 'server-only';
import { cache } from 'react';
import { unstable_cache } from 'next/cache';
import { BANNER_SLOTS, staticBannerRings, type BannerRing } from '@/lib/banner';
import type { FilterId } from '@/components/editorial/filterEvents';
import {
	HERO_MAX_SLIDES,
	isProductFilter,
	staticHeroSlides,
	toHeroSlides,
	type HeroRingSlide,
} from '@/lib/hero';
import {
	DEFAULT_MAKING_HEADING,
	DEFAULT_MAKING_STAGES,
	makingEyebrow,
	type MakingContent,
	type MakingSource,
} from '@/lib/making';
import {
	displayIndex,
	productPath,
	staticCatalogue,
	type Catalogue,
	type Collection,
	type Product,
} from '@/lib/catalogue';
import { collections as db, isDbConfigured } from '@/lib/db/mongo';
import type { CollectionDoc, ProductDoc } from '@/lib/db/types';

/** Cache tag for everything the public site reads from the catalogue. */
export const CATALOGUE_TAG = 'catalogue';

export function toCollection(doc: CollectionDoc, index: number): Collection {
	return {
		id: doc._id.toHexString(),
		slug: doc.slug,
		index: displayIndex(index),
		title: doc.title,
		description: doc.description,
		...(doc.cover && { cover: doc.cover }),
	};
}

export function toProduct(
	doc: ProductDoc,
	slugById: Map<string, string>,
): Product {
	return {
		id: doc._id.toHexString(),
		slug: doc.slug,
		name: doc.name,
		...(doc.reference && { reference: doc.reference }),
		description: doc.description,
		category: doc.category,
		...(doc.design && { design: doc.design }),
		...(doc.gemstone && { gemstone: doc.gemstone }),
		...(doc.metal && { metal: doc.metal }),
		...(doc.weight && { weight: doc.weight }),
		...(doc.dimensions && { dimensions: doc.dimensions }),
		specs: doc.specs ?? [],
		tags: doc.tags ?? [],
		collections: (doc.collectionIds ?? [])
			.map((id) => slugById.get(id.toHexString()))
			.filter((slug): slug is string => !!slug),
		images: doc.images ?? [],
		featured: !!doc.featured,
	};
}

async function loadFromDb(): Promise<Catalogue | null> {
	const { products, collections, meta } = await db();
	// Until the starter catalogue is imported, keep showing the built-in one.
	if (!(await meta.findOne({ _id: 'catalogue' }))) return null;

	const [collectionDocs, productDocs] = await Promise.all([
		collections
			.find({ visible: true })
			.sort({ position: 1, createdAt: 1 })
			.toArray(),
		products
			.find({ visible: true })
			.sort({ position: 1, createdAt: 1 })
			.toArray(),
	]);
	const visibleCollections = collectionDocs.map(toCollection);
	const slugById = new Map(visibleCollections.map((c) => [c.id, c.slug]));
	return {
		collections: visibleCollections,
		products: productDocs.map((d) => toProduct(d, slugById)),
	};
}

const cachedCatalogue = unstable_cache(
	async () => (await loadFromDb()) ?? staticCatalogue(),
	['public-catalogue'],
	{ tags: [CATALOGUE_TAG] },
);

/**
 * Visible products and collections, in display order. Cached until an admin
 * change invalidates `CATALOGUE_TAG`. Without a database (or if it can't be
 * reached) the built-in catalogue is served so the site never goes blank.
 */
export const getCatalogue = cache(async (): Promise<Catalogue> => {
	if (!isDbConfigured()) return staticCatalogue();
	try {
		return await cachedCatalogue();
	} catch (error) {
		console.error(
			'Catalogue: database unavailable, using built-in data',
			error,
		);
		return staticCatalogue();
	}
});

export async function getPublicProduct(slug: string) {
	const catalogue = await getCatalogue();
	return {
		catalogue,
		product: catalogue.products.find((p) => p.slug === slug),
	};
}

/* ------------------------------------------------------------ Banner rings */

async function loadBannerFromDb(): Promise<BannerRing[] | null> {
	const { bannerRings, products, meta } = await db();
	if (!(await meta.findOne({ _id: 'banner' }))) return null;
	const rings = await bannerRings
		.find({ visible: true })
		.sort({ position: 1, createdAt: 1 })
		.limit(BANNER_SLOTS)
		.toArray();
	// Link only to products that are publicly visible.
	const linked = await products
		.find(
			{
				_id: {
					$in: rings.flatMap((r) =>
						r.productId ? [r.productId] : [],
					),
				},
				visible: true,
			},
			{ projection: { slug: 1 } },
		)
		.toArray();
	const slugById = new Map(linked.map((p) => [p._id.toHexString(), p.slug]));
	return rings.map((r) => {
		const slug = r.productId && slugById.get(r.productId.toHexString());
		return {
			id: r._id.toHexString(),
			name: r.name,
			alt: r.alt,
			image: r.image.url,
			glow: r.glow,
			href: slug ? productPath(slug) : '/products',
		};
	});
}

// Only the database result is cached; the built-in fallback comes from code.
const cachedBanner = unstable_cache(loadBannerFromDb, ['home-banner-rings'], {
	tags: [CATALOGUE_TAG],
});

/**
 * The (up to four) rings for the home page banner. Shares the catalogue
 * cache tag, so product changes (slug, visibility) refresh the links too.
 */
export const getBannerRings = cache(async (): Promise<BannerRing[]> => {
	if (!isDbConfigured()) return staticBannerRings();
	try {
		return (await cachedBanner()) ?? staticBannerRings();
	} catch (error) {
		console.error(
			'Banner: database unavailable, using built-in rings',
			error,
		);
		return staticBannerRings();
	}
});

/* ------------------------------------------------------------- Hero slides */

async function loadHeroFromDb(): Promise<HeroRingSlide[] | null> {
	const { heroSlides, collections, meta } = await db();
	if (!(await meta.findOne({ _id: 'hero' }))) return null;
	const slides = await heroSlides
		.find({ visible: true })
		.sort({ position: 1, createdAt: 1 })
		.limit(HERO_MAX_SLIDES)
		.toArray();
	// The hero is the 3D stage everything starts from; never leave it empty.
	if (!slides.length) return null;
	const live = new Set(
		(
			await collections
				.find({ visible: true }, { projection: { slug: 1 } })
				.toArray()
		).map((c) => c.slug),
	);
	// Explore falls back to everything if its collection is gone or hidden.
	const target = (t: string): FilterId =>
		isProductFilter(t)
			? (t as FilterId)
			: t.startsWith('collection:') && live.has(t.slice(11))
				? (t as FilterId)
				: 'all';
	return toHeroSlides(
		slides.map((s) => ({
			id: s._id.toHexString(),
			name: s.name,
			collection: s.collection,
			description: s.description,
			gem: s.gem,
			metal: s.metal,
			filterTarget: target(s.filterTarget),
			glow: s.glow,
			mode: s.mode ?? '3d',
			photos: s.photos ?? [],
			spin: s.spin ?? [],
		})),
	);
}

const cachedHero = unstable_cache(loadHeroFromDb, ['home-hero-slides'], {
	tags: [CATALOGUE_TAG],
});

/** Slides for the 3D hero banner (built-in ones until managed in the admin). */
export const getHeroSlides = cache(async (): Promise<HeroRingSlide[]> => {
	if (!isDbConfigured()) return staticHeroSlides();
	try {
		return (await cachedHero()) ?? staticHeroSlides();
	} catch (error) {
		console.error(
			'Hero: database unavailable, using built-in slides',
			error,
		);
		return staticHeroSlides();
	}
});

/* --------------------------------------------------------- Making section */

type MakingSettings = {
	visible: boolean;
	eyebrow: string;
	heading: string;
	stages: string[];
	source: MakingSource;
	spin: string[];
};

async function loadMakingFromDb(): Promise<MakingSettings | null> {
	const { homeSections } = await db();
	const doc = await homeSections.findOne({ _id: 'making' });
	if (!doc) return null;
	return {
		visible: doc.visible,
		eyebrow: doc.eyebrow,
		heading: doc.heading,
		stages: doc.stages,
		source: doc.source,
		spin: (doc.spin ?? []).map((f) => f.url),
	};
}

const cachedMaking = unstable_cache(loadMakingFromDb, ['home-making'], {
	tags: [CATALOGUE_TAG],
});

/**
 * Content of the "Making" section, or `null` when it is hidden or has no
 * ring to show. Until it is saved in the admin it shows the 3D banner's first
 * 360° ring with the built-in text.
 */
export const getMakingSection = cache(
	async (heroSlides: HeroRingSlide[]): Promise<MakingContent | null> => {
		let saved: MakingSettings | null = null;
		if (isDbConfigured()) {
			try {
				saved = await cachedMaking();
			} catch (error) {
				console.error(
					'Making: database unavailable, using built-in section',
					error,
				);
			}
		}
		if (saved && !saved.visible) return null;
		const bannerRing =
			heroSlides.find((s) => s.spin?.length) ??
			staticHeroSlides().find((s) => s.spin?.length);
		const frames =
			saved?.source === 'own' ? saved.spin : (bannerRing?.spin ?? []);
		if (!frames.length) return null;
		return {
			eyebrow: saved?.eyebrow || makingEyebrow(bannerRing?.name ?? ''),
			heading: saved?.heading || DEFAULT_MAKING_HEADING,
			stages: DEFAULT_MAKING_STAGES.map(
				(fallback, i) => saved?.stages[i] || fallback,
			),
			frames,
		};
	},
);
