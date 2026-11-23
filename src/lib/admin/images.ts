import 'server-only';
import { collections as db } from '@/lib/db/mongo';
import { destroyImages, isModelPublicId } from '@/lib/cloudinary';

/**
 * Delete Cloudinary images that nothing in the database still uses
 * (product images, collection covers, banner rings, hero photos). Call after an image
 * was removed, replaced, or its owner deleted.
 */
export async function destroyIfUnused(publicIds: (string | undefined)[]) {
	const all = [...new Set(publicIds.filter((x): x is string => !!x))];
	// GLB models are raw files: checked and deleted separately.
	const models = all.filter(isModelPublicId);
	const candidates = all.filter((id) => !isModelPublicId(id));
	if (models.length) {
		const { heroSlides, homeSections } = await db();
		const used = new Set<unknown>([
			...(await heroSlides.distinct('model.publicId', {
				'model.publicId': { $in: models },
			})),
			...(await homeSections.distinct('model.publicId', {
				'model.publicId': { $in: models },
			})),
		]);
		await destroyImages(
			models.filter((id) => !used.has(id)),
			'raw',
		);
	}
	if (!candidates.length) return;
	const { products, collections, bannerRings, heroSlides, homeSections } =
		await db();
	const [
		inProducts,
		inCollections,
		inBanner,
		inHero,
		inSpin,
		inSections,
		inSectionModel,
	] = await Promise.all([
		products.distinct('images.publicId', {
			'images.publicId': { $in: candidates },
		}),
		collections.distinct('cover.publicId', {
			'cover.publicId': { $in: candidates },
		}),
		bannerRings.distinct('image.publicId', {
			'image.publicId': { $in: candidates },
		}),
		heroSlides.distinct('photos.publicId', {
			'photos.publicId': { $in: candidates },
		}),
		heroSlides.distinct('spin.publicId', {
			'spin.publicId': { $in: candidates },
		}),
		homeSections.distinct('spin.publicId', {
			'spin.publicId': { $in: candidates },
		}),
		homeSections.distinct('modelSpin.publicId', {
			'modelSpin.publicId': { $in: candidates },
		}),
	]);
	const used = new Set<unknown>([
		...inProducts,
		...inCollections,
		...inBanner,
		...inHero,
		...inSpin,
		...inSections,
		...inSectionModel,
	]);
	await destroyImages(candidates.filter((id) => !used.has(id)));
}
