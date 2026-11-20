'use server';

import { ObjectId } from 'mongodb';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth/session';
import { collections as db } from '@/lib/db/mongo';
import { ENQUIRY_STATUSES, type EnquiryStatus } from '@/lib/db/types';
import type { ActionResult } from './catalogue';

const oid = (id: string) =>
	ObjectId.isValid(id) && id.length === 24 ? new ObjectId(id) : null;

export async function updateEnquiry(
	id: string,
	changes: { status?: EnquiryStatus; notes?: string },
): Promise<ActionResult> {
	await requireAdmin();
	const _id = oid(id);
	if (!_id) return { ok: false, message: 'Not found.' };
	const set: Record<string, unknown> = { updatedAt: new Date() };
	if (changes.status !== undefined) {
		if (!ENQUIRY_STATUSES.includes(changes.status))
			return { ok: false, message: 'Unknown status.' };
		set.status = changes.status;
	}
	if (changes.notes !== undefined) {
		if (typeof changes.notes !== 'string' || changes.notes.length > 4000)
			return {
				ok: false,
				message: 'Notes must be under 4,000 characters.',
			};
		set.notes = changes.notes.trim();
	}
	const { enquiries } = await db();
	const res = await enquiries.updateOne({ _id }, { $set: set });
	if (!res.matchedCount)
		return { ok: false, message: 'This enquiry no longer exists.' };
	revalidatePath('/admin', 'layout');
	return { ok: true };
}

export async function deleteEnquiry(id: string): Promise<ActionResult> {
	await requireAdmin();
	const _id = oid(id);
	if (!_id) return { ok: false, message: 'Not found.' };
	const { enquiries } = await db();
	await enquiries.deleteOne({ _id });
	revalidatePath('/admin', 'layout');
	return { ok: true };
}
