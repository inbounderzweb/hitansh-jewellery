'use server';

import { updateTag } from 'next/cache';
import { ObjectId } from 'mongodb';
import { requireAdmin } from '@/lib/auth/session';
import { collections as db } from '@/lib/db/mongo';
import type { HeroSlideDoc } from '@/lib/db/types';
import { CATALOGUE_TAG } from '@/lib/data/catalogue';
import { STARTER_HERO_SLIDES } from '@/lib/hero';
import type { ImageAsset } from '@/lib/catalogue';
import { sanitiseImage } from '@/lib/cloudinary';
import { destroyIfUnused } from '@/lib/admin/images';
import { parseHeroSlide, validateHeroSlide } from '@/lib/admin/validation';
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

const LAST_VISIBLE =
	'The 3D banner needs at least one visible slide. Make another slide visible first.';

/** The hero lives on the home page, which reads the catalogue tag. */
const refreshPublic = () => updateTag(CATALOGUE_TAG);

/** Copy the four built-in slides into the database (one-off). */
export async function importHeroSlides(): Promise<ActionResult> {
	await requireAdmin();
	const { heroSlides, meta } = await db();
	if (await meta.findOne({ _id: 'hero' }))
		return fail('The banner slides have already been set up.');
	const now = new Date();
	const docs: HeroSlideDoc[] = STARTER_HERO_SLIDES.map((s, position) => ({
		_id: new ObjectId(),
		...s,
		visible: true,
		position,
		createdAt: now,
		updatedAt: now,
	}));
	await heroSlides.insertMany(docs);
	await meta.updateOne(
		{ _id: 'hero' },
		{ $setOnInsert: { initialisedAt: now } },
		{ upsert: true },
	);
	refreshPublic();
	return { ok: true };
}

export async function saveHeroSlide(
	id: string | null,
	raw: unknown,
): Promise<ActionResult> {
	await requireAdmin();
	const { heroSlides, meta } = await db();
	if (!(await meta.findOne({ _id: 'hero' })))
		return fail('Set up the banner slides first.');

	const input = parseHeroSlide(raw);
	const errors = validateHeroSlide(input);
	const photos = input.photos.map(sanitiseImage);
	if (photos.some((p) => !p))
		errors.photos = 'A photo could not be verified. Upload it again.';
	const spin = input.spin.map(sanitiseImage);
	if (spin.some((f) => !f))
		errors.spin =
			'The spin frames could not be verified. Add the video again.';
	if (Object.keys(errors).length)
		return fail('Please correct the highlighted fields.', errors);

	const existing = id
		? await heroSlides.findOne({ _id: oid(id) ?? undefined })
		: null;
	if (id && !existing) return fail('This slide no longer exists.');

	if (existing?.visible && !input.visible) {
		const others = await heroSlides.countDocuments({
			visible: true,
			_id: { $ne: existing._id },
		});
		if (!others) return fail(LAST_VISIBLE);
	}

	const now = new Date();
	const fields = {
		name: input.name,
		collection: input.collection,
		description: input.description,
		gem: input.gem,
		metal: input.metal,
		filterTarget: input.filterTarget,
		glow: input.glow,
		mode: input.mode,
		photos: photos as ImageAsset[],
		spin: (spin as ImageAsset[]).map(({ url, publicId }) => ({
			url,
			...(publicId && { publicId }),
		})),
		visible: input.visible,
		updatedAt: now,
	};

	let savedId: ObjectId;
	if (existing) {
		await heroSlides.updateOne({ _id: existing._id }, { $set: fields });
		savedId = existing._id;
		const kept = new Set(
			[...fields.photos, ...fields.spin].map((p) => p.publicId),
		);
		await destroyIfUnused(
			[...(existing.photos ?? []), ...(existing.spin ?? [])]
				.map((p) => p.publicId)
				.filter((id) => !kept.has(id)),
		);
	} else {
		const last = await heroSlides
			.find({}, { projection: { position: 1 } })
			.sort({ position: -1 })
			.limit(1)
			.next();
		savedId = new ObjectId();
		await heroSlides.insertOne({
			_id: savedId,
			...fields,
			position: (last?.position ?? -1) + 1,
			createdAt: now,
		});
	}
	refreshPublic();
	return { ok: true, id: savedId.toHexString() };
}

export async function deleteHeroSlide(id: string): Promise<ActionResult> {
	await requireAdmin();
	const _id = oid(id);
	if (!_id) return fail('Not found.');
	const { heroSlides } = await db();
	const slide = await heroSlides.findOne({ _id });
	if (!slide) return fail('This slide no longer exists.');
	if (
		slide.visible &&
		!(await heroSlides.countDocuments({ visible: true, _id: { $ne: _id } }))
	)
		return fail(
			'This is the only visible slide, and the 3D banner needs at least one. Make another slide visible first.',
		);
	await heroSlides.deleteOne({ _id });
	await destroyIfUnused(
		[...(slide.photos ?? []), ...(slide.spin ?? [])].map((p) => p.publicId),
	);
	refreshPublic();
	return { ok: true };
}

export async function moveHeroSlide(
	id: string,
	direction: 'up' | 'down',
): Promise<ActionResult> {
	await requireAdmin();
	const target = oid(id);
	if (!target) return fail('Not found.');
	const { heroSlides } = await db();
	const items = await heroSlides
		.find({}, { projection: { _id: 1 } })
		.sort({ position: 1, createdAt: 1 })
		.toArray();
	const from = items.findIndex((i) => i._id.equals(target));
	const to = direction === 'up' ? from - 1 : from + 1;
	if (from < 0) return fail('Not found.');
	if (to < 0 || to >= items.length) return { ok: true };
	[items[from], items[to]] = [items[to], items[from]];
	await heroSlides.bulkWrite(
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

export async function setHeroSlideVisible(
	id: string,
	value: boolean,
): Promise<ActionResult> {
	await requireAdmin();
	const _id = oid(id);
	if (!_id) return fail('Not found.');
	const { heroSlides } = await db();
	if (
		value !== true &&
		!(await heroSlides.countDocuments({ visible: true, _id: { $ne: _id } }))
	)
		return fail(LAST_VISIBLE);
	await heroSlides.updateOne(
		{ _id },
		{ $set: { visible: value === true, updatedAt: new Date() } },
	);
	refreshPublic();
	return { ok: true };
}
