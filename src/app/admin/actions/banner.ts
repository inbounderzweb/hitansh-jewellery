'use server';

import { updateTag } from 'next/cache';
import { ObjectId } from 'mongodb';
import { requireAdmin } from '@/lib/auth/session';
import { collections as db } from '@/lib/db/mongo';
import type { BannerRingDoc } from '@/lib/db/types';
import { CATALOGUE_TAG } from '@/lib/data/catalogue';
import { STARTER_RINGS } from '@/lib/banner';
import { sanitiseImage } from '@/lib/cloudinary';
import { destroyIfUnused } from '@/lib/admin/images';
import { parseBannerRing, validateBannerRing } from '@/lib/admin/validation';
import type { ActionResult } from './catalogue';

const oid = (id: string) =>
	ObjectId.isValid(id) && id.length === 24 ? new ObjectId(id) : null;

const fail = (
	message: string,
	errors?: Record<string, string>,
): ActionResult => ({
	ok: false,
	message,
	...(errors && { errors }),
});

/** The banner lives on the home page, which reads the catalogue tag. */
const refreshPublic = () => updateTag(CATALOGUE_TAG);

async function markInitialised() {
	const { meta } = await db();
	await meta.updateOne(
		{ _id: 'banner' },
		{ $setOnInsert: { initialisedAt: new Date() } },
		{ upsert: true },
	);
}

/** Copy the four built-in rings into the database (one-off). */
export async function importBannerRings(): Promise<ActionResult> {
	await requireAdmin();
	const { bannerRings, products, meta } = await db();
	if (await meta.findOne({ _id: 'banner' }))
		return fail('The banner rings have already been set up.');

	// Link to the matching products if the catalogue has been imported.
	const linked = await products
		.find(
			{ slug: { $in: STARTER_RINGS.map((r) => r.productSlug) } },
			{ projection: { slug: 1 } },
		)
		.toArray();
	const idBySlug = new Map(linked.map((p) => [p.slug, p._id]));
	const now = new Date();
	const docs: BannerRingDoc[] = STARTER_RINGS.map((r, position) => {
		const productId = idBySlug.get(r.productSlug);
		return {
			_id: new ObjectId(),
			name: r.name,
			alt: r.alt,
			image: { url: r.image },
			glow: r.glow,
			...(productId && { productId }),
			visible: true,
			position,
			createdAt: now,
			updatedAt: now,
		};
	});
	await bannerRings.insertMany(docs);
	await markInitialised();
	refreshPublic();
	return { ok: true };
}

/** Manage the banner from the database without importing the built-in rings. */
export async function startEmptyBanner(): Promise<ActionResult> {
	await requireAdmin();
	await markInitialised();
	refreshPublic();
	return { ok: true };
}

export async function saveBannerRing(
	id: string | null,
	raw: unknown,
): Promise<ActionResult> {
	await requireAdmin();
	const { bannerRings, products, meta } = await db();
	if (!(await meta.findOne({ _id: 'banner' })))
		return fail('Set up the banner rings first.');

	const input = parseBannerRing(raw);
	const errors = validateBannerRing(input);
	const image = input.image ? sanitiseImage(input.image) : null;
	if (input.image && !image)
		errors.image = 'The image could not be verified. Upload it again.';
	if (Object.keys(errors).length)
		return fail('Please correct the highlighted fields.', errors);

	const existing = id
		? await bannerRings.findOne({ _id: oid(id) ?? undefined })
		: null;
	if (id && !existing) return fail('This ring no longer exists.');

	const productId = input.productId
		? (
				await products.findOne(
					{ _id: new ObjectId(input.productId) },
					{ projection: { _id: 1 } },
				)
			)?._id
		: undefined;

	const now = new Date();
	const fields = {
		name: input.name,
		alt: input.alt || input.name,
		image: image!,
		glow: input.glow,
		visible: input.visible,
		updatedAt: now,
	};

	let savedId: ObjectId;
	if (existing) {
		await bannerRings.updateOne(
			{ _id: existing._id },
			productId
				? { $set: { ...fields, productId } }
				: { $set: fields, $unset: { productId: '' } },
		);
		savedId = existing._id;
		if (existing.image.publicId !== image!.publicId)
			await destroyIfUnused([existing.image.publicId]);
	} else {
		const last = await bannerRings
			.find({}, { projection: { position: 1 } })
			.sort({ position: -1 })
			.limit(1)
			.next();
		savedId = new ObjectId();
		await bannerRings.insertOne({
			_id: savedId,
			...fields,
			...(productId && { productId }),
			position: (last?.position ?? -1) + 1,
			createdAt: now,
		});
	}
	refreshPublic();
	return { ok: true, id: savedId.toHexString() };
}

export async function deleteBannerRing(id: string): Promise<ActionResult> {
	await requireAdmin();
	const _id = oid(id);
	if (!_id) return fail('Not found.');
	const { bannerRings } = await db();
	const removed = await bannerRings.findOneAndDelete({ _id });
	if (!removed) return fail('This ring no longer exists.');
	await destroyIfUnused([removed.image.publicId]);
	refreshPublic();
	return { ok: true };
}

export async function moveBannerRing(
	id: string,
	direction: 'up' | 'down',
): Promise<ActionResult> {
	await requireAdmin();
	const target = oid(id);
	if (!target) return fail('Not found.');
	const { bannerRings } = await db();
	const items = await bannerRings
		.find({}, { projection: { _id: 1 } })
		.sort({ position: 1, createdAt: 1 })
		.toArray();
	const from = items.findIndex((i) => i._id.equals(target));
	const to = direction === 'up' ? from - 1 : from + 1;
	if (from < 0) return fail('Not found.');
	if (to < 0 || to >= items.length) return { ok: true };
	[items[from], items[to]] = [items[to], items[from]];
	await bannerRings.bulkWrite(
		items.map((item, position) => ({
			updateOne: {
				filter: { _id: item._id },
				update: { $set: { position } },
			},
		})),
	);
	refreshPublic();
	return { ok: true };
}

export async function setBannerRingVisible(
	id: string,
	value: boolean,
): Promise<ActionResult> {
	await requireAdmin();
	const _id = oid(id);
	if (!_id) return fail('Not found.');
	const { bannerRings } = await db();
	await bannerRings.updateOne(
		{ _id },
		{ $set: { visible: value === true, updatedAt: new Date() } },
	);
	refreshPublic();
	return { ok: true };
}
