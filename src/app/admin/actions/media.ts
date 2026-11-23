'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth/session';
import { isOwnPublicId } from '@/lib/cloudinary';
import { destroyIfUnused } from '@/lib/admin/images';

/**
 * Delete files from the media library. Only files nothing on the website
 * uses are deleted: `destroyIfUnused` checks the database again, so a file
 * that became used meanwhile is kept.
 */
export async function deleteMedia(publicIds: unknown): Promise<void> {
	await requireAdmin();
	if (!Array.isArray(publicIds)) return;
	await destroyIfUnused(
		publicIds
			.filter((id): id is string => typeof id === 'string')
			.filter(isOwnPublicId)
			.slice(0, 1000),
	);
	revalidatePath('/admin/media');
}
