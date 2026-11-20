import type { ObjectId } from 'mongodb';
import type { ImageAsset, ProductCategory, Spec } from '@/lib/catalogue';

export type ProductDoc = {
	_id: ObjectId;
	slug: string;
	name: string;
	/** Unique when present; stored as `undefined` (absent) when empty. */
	reference?: string;
	description: string;
	category: string;
	design?: string;
	gemstone?: string;
	metal?: string;
	weight?: string;
	dimensions?: string;
	specs: Spec[];
	tags: ProductCategory[];
	collectionIds: ObjectId[];
	images: ImageAsset[];
	featured: boolean;
	visible: boolean;
	position: number;
	createdAt: Date;
	updatedAt: Date;
};

export type CollectionDoc = {
	_id: ObjectId;
	slug: string;
	title: string;
	description: string;
	cover?: ImageAsset;
	visible: boolean;
	position: number;
	createdAt: Date;
	updatedAt: Date;
};

export const ENQUIRY_STATUSES = ['new', 'contacted', 'completed'] as const;
export type EnquiryStatus = (typeof ENQUIRY_STATUSES)[number];

export type EnquiryDoc = {
	_id: ObjectId;
	name: string;
	email: string;
	phone: string;
	message: string;
	/** Snapshot taken at submission, so it survives product edits/deletion. */
	product: {
		id?: string;
		slug: string;
		name: string;
		reference?: string;
	} | null;
	status: EnquiryStatus;
	notes?: string;
	createdAt: Date;
	updatedAt: Date;
};

export type AdminUserDoc = {
	_id: ObjectId;
	email: string;
	name: string;
	passwordHash: string;
	createdAt: Date;
	lastLoginAt?: Date;
};

export type SessionDoc = {
	/** SHA-256 of the session token; the token itself is only in the cookie. */
	_id: string;
	userId: ObjectId;
	createdAt: Date;
	expiresAt: Date;
};

export type RateLimitDoc = {
	_id: string;
	count: number;
	expiresAt: Date;
};

export type MetaDoc = {
	/**
	 * `catalogue`: products & collections managed in the database.
	 * `banner`: banner rings managed in the database.
	 * `hero`: 3D hero slides managed in the database.
	 */
	_id: 'catalogue' | 'banner' | 'hero';
	/** Set once the starter data has been imported (or skipped). */
	initialisedAt: Date;
};

/** The home page's "Making" section (a single document). */
export type MakingDoc = {
	_id: 'making';
	visible: boolean;
	eyebrow: string;
	heading: string;
	/** Titles of the four craft stages, in order. */
	stages: string[];
	/** `banner`: the 3D banner's first 360° ring; `own`: `spin` below. */
	source: 'banner' | 'own';
	spin: ImageAsset[];
	updatedAt: Date;
};

/** One ring image in the home page's scrolling four-ring banner. */
export type BannerRingDoc = {
	_id: ObjectId;
	name: string;
	alt: string;
	image: ImageAsset;
	/** Glow colour behind the ring, `#rrggbb`. */
	glow: string;
	/** Product the ring links to; the catalogue page when unset. */
	productId?: ObjectId;
	visible: boolean;
	position: number;
	createdAt: Date;
	updatedAt: Date;
};

/** One slide of the 3D hero banner at the top of the home page. */
export type HeroSlideDoc = {
	_id: ObjectId;
	name: string;
	/** Line above the name, e.g. "Bridal Solitaire". */
	collection: string;
	description: string;
	/** Gemstone preset name (see `GEM_PRESETS`). */
	gem: string;
	/** Metal preset name (see `METAL_PRESETS`). */
	metal: string;
	/** Product filter for "Explore Collection": a category, `all`, or `collection:<slug>`. */
	filterTarget: string;
	/** Glow colour behind the ring, `#rrggbb`. */
	glow: string;
	/**
	 * `spin`: 360° frames played by scrolling; `photos`: views of the ring in
	 * turn; `3d`: the recoloured 3D model. Default `3d`.
	 */
	mode?: 'spin' | 'photos' | '3d';
	/** Views of the ring for a photo slide, in order. */
	photos?: ImageAsset[];
	/** Frames of one full turn for a spin slide, in order. */
	spin?: ImageAsset[];
	visible: boolean;
	position: number;
	createdAt: Date;
	updatedAt: Date;
};
