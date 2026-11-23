'use server';

import { updateTag } from 'next/cache';
import { requireAdmin } from '@/lib/auth/session';
import { collections as db } from '@/lib/db/mongo';
import type { ImageAsset } from '@/lib/catalogue';
import { CATALOGUE_TAG } from '@/lib/data/catalogue';
import { sanitiseImage, sanitiseModel } from '@/lib/cloudinary';
import { destroyIfUnused } from '@/lib/admin/images';
import { parseMaking, validateMaking } from '@/lib/admin/validation';
import type { ActionResult } from './catalogue';

/** Save the home page's "Making" section. */
export async function saveMaking(raw: unknown): Promise<ActionResult> {
	await requireAdmin();
	const input = parseMaking(raw);
	const errors = validateMaking(input);
	// Frames are kept even while the banner ring is used, so switching back
	// to "own" doesn't need the video again.
	const spin = input.spin.map(sanitiseImage);
	if (spin.some((f) => !f))
		errors.spin =
			'The spin frames could not be verified. Add the video again.';
	const model = input.model ? sanitiseModel(input.model) : null;
	if (input.model && !model)
		errors.model = 'The 3D model could not be verified. Upload it again.';
	if (Object.keys(errors).length)
		return {
			ok: false,
			message: 'Please correct the highlighted fields.',
			errors,
		};

	const { homeSections } = await db();
	const existing = await homeSections.findOne({ _id: 'making' });
	const asFrames = (list: (ImageAsset | null)[]) =>
		(list as ImageAsset[]).map(({ url, publicId }) => ({
			url,
			...(publicId && { publicId }),
		}));
	const frames = asFrames(spin);
	await homeSections.updateOne(
		{ _id: 'making' },
		{
			$set: {
				visible: input.visible,
				eyebrow: input.eyebrow,
				heading: input.heading,
				stages: input.stages,
				source: input.source,
				spin: frames,
				model,
				gem: input.gem,
				metal: input.metal,
				modelSpin: [],
				rendered: null,
				updatedAt: new Date(),
			},
		},
		{ upsert: true },
	);
	if (existing) {
		const kept = new Set(
			[...frames, ...(model ? [model] : [])].map((f) => f.publicId),
		);
		await destroyIfUnused(
			[
				...(existing.spin ?? []),
				...(existing.modelSpin ?? []),
				...(existing.model ? [existing.model] : []),
			]
				.map((f) => f.publicId)
				.filter((id) => !kept.has(id)),
		);
	}
	updateTag(CATALOGUE_TAG);
	return { ok: true };
}
