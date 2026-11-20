'use server';

import { updateTag } from 'next/cache';
import {
	MongoServerError,
	ObjectId,
	type Collection as MongoCollection,
} from 'mongodb';
import { requireAdmin } from '@/lib/auth/session';
import { collections as db } from '@/lib/db/mongo';
import type { CollectionDoc, ProductDoc } from '@/lib/db/types';
import { CATALOGUE_TAG } from '@/lib/data/catalogue';
import { staticCatalogue, type ImageAsset } from '@/lib/catalogue';
import {
	createUploadSignature,
	sanitiseImage,
	UPLOAD_KINDS,
	type UploadKind,
	type UploadSignature,
} from '@/lib/cloudinary';
import { destroyIfUnused } from '@/lib/admin/images';
import {
	parseCollection,
	parseProduct,
	validateCollection,
	validateProduct,
	type FieldErrors,
} from '@/lib/admin/validation';

export type ActionResult =
	| { ok: true; id?: string }
	| { ok: false; errors?: FieldErrors; message?: string };

const fail = (message: string, errors?: FieldErrors): ActionResult => ({
	ok: false,
	message,
	...(errors && { errors }),
});

const oid = (id: string) =>
	ObjectId.isValid(id) && id.length === 24 ? new ObjectId(id) : null;

/** Refresh every public page that shows catalogue data. */
const refreshPublic = () => updateTag(CATALOGUE_TAG);

async function isInitialised() {
	const { meta } = await db();
	return !!(await meta.findOne({ _id: 'catalogue' }));
}

function duplicateField(error: unknown): string | null {
	if (error instanceof MongoServerError && error.code === 11000) {
		return Object.keys(error.keyPattern ?? {})[0] ?? 'slug';
	}
	return null;
}

/** Products and collections share the ordering fields. */
type Ordered = { _id: ObjectId; position: number; createdAt: Date };
type OrderedCollection =
	MongoCollection<ProductDoc> | MongoCollection<CollectionDoc>;
const ordered = (col: OrderedCollection) =>
	col as unknown as MongoCollection<Ordered>;

async function nextPosition(col: OrderedCollection) {
	const last = await ordered(col)
		.find({}, { projection: { position: 1 } })
		.sort({ position: -1 })
		.limit(1)
		.next();
	return (last?.position ?? -1) + 1;
}

/** Swap an item with its neighbour, renumbering positions 0..n. */
async function move(
	source: OrderedCollection,
	id: string,
	direction: 'up' | 'down',
) {
	const col = ordered(source);
	const target = oid(id);
	if (!target) return fail('Not found.');
	const items = await col
		.find({}, { projection: { _id: 1 } })
		.sort({ position: 1, createdAt: 1 })
		.toArray();
	const from = items.findIndex((i) => i._id.equals(target));
	const to = direction === 'up' ? from - 1 : from + 1;
	if (from < 0) return fail('Not found.');
	if (to < 0 || to >= items.length) return { ok: true } as ActionResult;
	[items[from], items[to]] = [items[to], items[from]];
	await col.bulkWrite(
		items.map((item, position) => ({
			updateOne: {
				filter: { _id: item._id },
				update: { $set: { position } },
			},
		})),
	);
	refreshPublic();
	return { ok: true } as ActionResult;
}

/* ------------------------------------------------------------------ Setup */

/** Copy the built-in catalogue into the database (one-off). */
export async function importStarterCatalogue(): Promise<ActionResult> {
	await requireAdmin();
	if (await isInitialised())
		return fail('The catalogue has already been set up.');
	const { products, collections, meta } = await db();
	const starter = staticCatalogue();
	const now = new Date();

	const collectionIds = new Map<string, ObjectId>();
	const collectionDocs: CollectionDoc[] = starter.collections.map(
		(c, position) => {
			const _id = new ObjectId();
			collectionIds.set(c.slug, _id);
			return {
				_id,
				slug: c.slug,
				title: c.title,
				description: c.description,
				...(c.cover && { cover: c.cover }),
				visible: true,
				position,
				createdAt: now,
				updatedAt: now,
			};
		},
	);
	const productDocs: ProductDoc[] = starter.products.map((p, position) => ({
		_id: new ObjectId(),
		slug: p.slug,
		name: p.name,
		...(p.reference && { reference: p.reference }),
		description: p.description,
		category: p.category,
		...(p.design && { design: p.design }),
		...(p.gemstone && { gemstone: p.gemstone }),
		...(p.metal && { metal: p.metal }),
		specs: p.specs,
		tags: p.tags,
		collectionIds: p.collections
			.map((slug) => collectionIds.get(slug))
			.filter((x): x is ObjectId => !!x),
		images: p.images,
		featured: p.featured,
		visible: true,
		position,
		createdAt: now,
		updatedAt: now,
	}));

	try {
		await collections.insertMany(collectionDocs);
		await products.insertMany(productDocs);
	} catch (error) {
		console.error('Starter import failed', error);
		await Promise.all([
			collections.deleteMany({
				_id: { $in: collectionDocs.map((c) => c._id) },
			}),
			products.deleteMany({
				_id: { $in: productDocs.map((p) => p._id) },
			}),
		]);
		return fail(
			duplicateField(error)
				? 'Some of the starter pieces already exist in the database.'
				: 'The import failed. Please try again.',
		);
	}
	await meta.updateOne(
		{ _id: 'catalogue' },
		{ $setOnInsert: { initialisedAt: now } },
		{ upsert: true },
	);
	refreshPublic();
	return { ok: true };
}

/** Manage the catalogue from the database without importing anything. */
export async function startEmptyCatalogue(): Promise<ActionResult> {
	await requireAdmin();
	const { meta } = await db();
	await meta.updateOne(
		{ _id: 'catalogue' },
		{ $setOnInsert: { initialisedAt: new Date() } },
		{ upsert: true },
	);
	refreshPublic();
	return { ok: true };
}

/* ---------------------------------------------------------------- Uploads */

export async function signUpload(
	kind: UploadKind,
): Promise<
	{ ok: true; signature: UploadSignature } | { ok: false; message: string }
> {
	await requireAdmin();
	const signature = createUploadSignature(
		UPLOAD_KINDS.includes(kind) ? kind : 'products',
	);
	return signature
		? { ok: true, signature }
		: {
				ok: false,
				message:
					'Image uploads are not configured. Set the CLOUDINARY_* environment variables.',
			};
}

/** Clean up images uploaded in a form that was then abandoned. */
export async function discardUploads(publicIds: string[]): Promise<void> {
	await requireAdmin();
	if (!Array.isArray(publicIds)) return;
	await destroyIfUnused(
		publicIds.filter((id) => typeof id === 'string').slice(0, 250),
	);
}

function cleanImages(raw: unknown[]): {
	images: ImageAsset[];
	invalid: boolean;
} {
	const images = raw.map(sanitiseImage);
	return {
		images: images.filter((i): i is ImageAsset => !!i),
		invalid: images.some((i) => !i),
	};
}

/* --------------------------------------------------------------- Products */

export async function saveProduct(
	id: string | null,
	raw: unknown,
): Promise<ActionResult> {
	await requireAdmin();
	if (!(await isInitialised()))
		return fail('Set up the catalogue on the dashboard first.');

	const input = parseProduct(raw);
	const errors = validateProduct(input);
	const { images, invalid } = cleanImages(input.images);
	if (invalid)
		errors.images =
			'One of the images could not be verified. Remove it and upload it again.';
	if (Object.keys(errors).length)
		return fail('Please correct the highlighted fields.', errors);

	const { products, collections } = await db();
	const existing = id
		? await products.findOne({ _id: oid(id) ?? undefined })
		: null;
	if (id && !existing) return fail('This product no longer exists.');

	const validCollectionIds = (
		await collections
			.find(
				{
					_id: {
						$in: input.collectionIds.map((c) => new ObjectId(c)),
					},
				},
				{ projection: { _id: 1 } },
			)
			.toArray()
	).map((c) => c._id);

	const optional = {
		reference: input.reference,
		design: input.design,
		gemstone: input.gemstone,
		metal: input.metal,
		weight: input.weight,
		dimensions: input.dimensions,
	};
	const set: Partial<ProductDoc> = {
		slug: input.slug,
		name: input.name,
		description: input.description,
		category: input.category,
		specs: input.specs,
		tags: input.tags,
		collectionIds: validCollectionIds,
		images,
		featured: input.featured,
		visible: input.visible,
		updatedAt: new Date(),
	};
	const unset: Record<string, ''> = {};
	for (const [key, value] of Object.entries(optional)) {
		if (value) (set as Record<string, unknown>)[key] = value;
		else unset[key] = '';
	}

	let savedId: ObjectId;
	try {
		if (existing) {
			await products.updateOne(
				{ _id: existing._id },
				{
					$set: set,
					...(Object.keys(unset).length && { $unset: unset }),
				},
			);
			savedId = existing._id;
		} else {
			savedId = new ObjectId();
			await products.insertOne({
				...(set as ProductDoc),
				_id: savedId,
				position: await nextPosition(products),
				createdAt: new Date(),
			});
		}
	} catch (error) {
		const field = duplicateField(error);
		if (field === 'reference')
			return fail('Please correct the highlighted fields.', {
				reference: 'Another product already uses this reference.',
			});
		if (field)
			return fail('Please correct the highlighted fields.', {
				slug: 'Another product already uses this URL slug.',
			});
		console.error('saveProduct failed', error);
		return fail('The product could not be saved. Please try again.');
	}

	if (existing) {
		const kept = new Set(images.map((i) => i.publicId));
		await destroyIfUnused(
			existing.images.map((i) => i.publicId).filter((p) => !kept.has(p)),
		);
	}
	refreshPublic();
	return { ok: true, id: savedId.toHexString() };
}

export async function deleteProduct(id: string): Promise<ActionResult> {
	await requireAdmin();
	const _id = oid(id);
	if (!_id) return fail('Not found.');
	const { products } = await db();
	const removed = await products.findOneAndDelete({ _id });
	if (!removed) return fail('This product no longer exists.');
	await destroyIfUnused(removed.images.map((i) => i.publicId));
	refreshPublic();
	return { ok: true };
}

export async function moveProduct(id: string, direction: 'up' | 'down') {
	await requireAdmin();
	const { products } = await db();
	return move(products, id, direction === 'up' ? 'up' : 'down');
}

export async function setProductFlag(
	id: string,
	flag: 'visible' | 'featured',
	value: boolean,
): Promise<ActionResult> {
	await requireAdmin();
	const _id = oid(id);
	if (!_id || (flag !== 'visible' && flag !== 'featured'))
		return fail('Not found.');
	const { products } = await db();
	if (flag === 'visible' && value) {
		const doc = await products.findOne(
			{ _id },
			{ projection: { images: 1 } },
		);
		if (!doc?.images?.length)
			return fail(
				'Add at least one image before making the product visible.',
			);
	}
	await products.updateOne(
		{ _id },
		{ $set: { [flag]: value === true, updatedAt: new Date() } },
	);
	refreshPublic();
	return { ok: true };
}

/* ------------------------------------------------------------ Collections */

export async function saveCollection(
	id: string | null,
	raw: unknown,
): Promise<ActionResult> {
	await requireAdmin();
	if (!(await isInitialised()))
		return fail('Set up the catalogue on the dashboard first.');

	const input = parseCollection(raw);
	const errors = validateCollection(input);
	const cover = input.cover ? sanitiseImage(input.cover) : null;
	if (input.cover && !cover)
		errors.cover =
			'The cover image could not be verified. Upload it again.';
	if (Object.keys(errors).length)
		return fail('Please correct the highlighted fields.', errors);

	const { products, collections } = await db();
	const existing = id
		? await collections.findOne({ _id: oid(id) ?? undefined })
		: null;
	if (id && !existing) return fail('This collection no longer exists.');

	const now = new Date();
	let savedId: ObjectId;
	try {
		if (existing) {
			await collections.updateOne(
				{ _id: existing._id },
				{
					$set: {
						title: input.title,
						slug: input.slug,
						description: input.description,
						visible: input.visible,
						updatedAt: now,
						...(cover && { cover }),
					},
					...(!cover && { $unset: { cover: '' } }),
				},
			);
			savedId = existing._id;
		} else {
			savedId = new ObjectId();
			await collections.insertOne({
				_id: savedId,
				title: input.title,
				slug: input.slug,
				description: input.description,
				...(cover && { cover }),
				visible: input.visible,
				position: await nextPosition(collections),
				createdAt: now,
				updatedAt: now,
			});
		}
	} catch (error) {
		if (duplicateField(error))
			return fail('Please correct the highlighted fields.', {
				slug: 'Another collection already uses this URL slug.',
			});
		console.error('saveCollection failed', error);
		return fail('The collection could not be saved. Please try again.');
	}

	// Membership lives on products (`collectionIds`), so pieces can belong
	// to several collections.
	const members = input.productIds.map((p) => new ObjectId(p));
	await Promise.all([
		products.updateMany(
			{ _id: { $in: members } },
			{ $addToSet: { collectionIds: savedId }, $set: { updatedAt: now } },
		),
		products.updateMany(
			{ _id: { $nin: members }, collectionIds: savedId },
			{ $pull: { collectionIds: savedId }, $set: { updatedAt: now } },
		),
	]);

	if (
		existing?.cover?.publicId &&
		existing.cover.publicId !== cover?.publicId
	)
		await destroyIfUnused([existing.cover.publicId]);
	refreshPublic();
	return { ok: true, id: savedId.toHexString() };
}

export async function deleteCollection(id: string): Promise<ActionResult> {
	await requireAdmin();
	const _id = oid(id);
	if (!_id) return fail('Not found.');
	const { products, collections } = await db();
	const removed = await collections.findOneAndDelete({ _id });
	if (!removed) return fail('This collection no longer exists.');
	await products.updateMany(
		{ collectionIds: _id },
		{ $pull: { collectionIds: _id } },
	);
	await destroyIfUnused([removed.cover?.publicId]);
	refreshPublic();
	return { ok: true };
}

export async function moveCollection(id: string, direction: 'up' | 'down') {
	await requireAdmin();
	const { collections } = await db();
	return move(collections, id, direction === 'up' ? 'up' : 'down');
}

export async function setCollectionVisible(
	id: string,
	value: boolean,
): Promise<ActionResult> {
	await requireAdmin();
	const _id = oid(id);
	if (!_id) return fail('Not found.');
	const { collections } = await db();
	if (value) {
		const doc = await collections.findOne(
			{ _id },
			{ projection: { cover: 1 } },
		);
		if (!doc?.cover)
			return fail(
				'Add a cover image before making the collection visible.',
			);
	}
	await collections.updateOne(
		{ _id },
		{ $set: { visible: value === true, updatedAt: new Date() } },
	);
	refreshPublic();
	return { ok: true };
}
