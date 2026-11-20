'use server';

import { updateTag } from 'next/cache';
import { requireAdmin } from '@/lib/auth/session';
import { collections as db } from '@/lib/db/mongo';
import type { ImageAsset } from '@/lib/catalogue';
import { CATALOGUE_TAG } from '@/lib/data/catalogue';
import { sanitiseImage } from '@/lib/cloudinary';
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
	if (Object.keys(errors).length)
		return {
			ok: false,
			message: 'Please correct the highlighted fields.',
			errors,
		};

	const { homeSections } = await db();
	const existing = await homeSections.findOne({ _id: 'making' });
	const frames = (spin as ImageAsset[]).map(({ url, publicId }) => ({
		url,
		...(publicId && { publicId }),
	}));
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
				updatedAt: new Date(),
			},
		},
		{ upsert: true },
	);
	if (existing) {
		const kept = new Set(frames.map((f) => f.publicId));
		await destroyIfUnused(
			(existing.spin ?? [])
				.map((f) => f.publicId)
				.filter((id) => !kept.has(id)),
		);
	}
	updateTag(CATALOGUE_TAG);
	return { ok: true };
}
