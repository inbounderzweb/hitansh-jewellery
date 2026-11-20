import 'server-only';
import { collections as db } from '@/lib/db/mongo';
import { destroyImages } from '@/lib/cloudinary';

/**
 * Delete Cloudinary images that nothing in the database still uses
 * (product images, collection covers, banner rings, hero photos). Call after an image
 * was removed, replaced, or its owner deleted.
 */
export async function destroyIfUnused(publicIds: (string | undefined)[]) {
	const candidates = [...new Set(publicIds.filter((x): x is string => !!x))];
	if (!candidates.length) return;
	const { products, collections, bannerRings, heroSlides } = await db();
	const [inProducts, inCollections, inBanner, inHero, inSpin] =
		await Promise.all([
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
		]);
	const used = new Set<unknown>([
		...inProducts,
		...inCollections,
		...inBanner,
		...inHero,
		...inSpin,
	]);
	await destroyImages(candidates.filter((id) => !used.has(id)));
}
