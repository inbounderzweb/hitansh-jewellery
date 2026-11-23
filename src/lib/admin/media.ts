import 'server-only';
import { requireAdmin } from '@/lib/auth/session';
import { collections as db } from '@/lib/db/mongo';
import { listUploads, type UploadedFile } from '@/lib/cloudinary';

/**
 * The admin's media library: every file uploaded to Cloudinary, with where
 * each is used on the website. A 360° spin's frames are grouped into one
 * entry per slide / section.
 */

export const MEDIA_FOLDERS = {
	products: 'Products',
	collections: 'Collections',
	hero: '3D banner',
	banner: 'Ring showcase',
	models: '3D models',
	other: 'Other',
} as const;
export type MediaFolder = keyof typeof MEDIA_FOLDERS;

export type MediaUse = { label: string; href: string };

export type MediaEntry = {
	/** The file's public ID, or `spin:<owner>` for a group of frames. */
	key: string;
	type: 'image' | 'spin' | 'model';
	folder: MediaFolder;
	name: string;
	url: string;
	/** Image to show (the first frame for a spin); none for models. */
	preview?: string;
	bytes: number;
	width?: number;
	height?: number;
	format?: string;
	/** Newest upload in the entry. */
	createdAt: string;
	frames?: number;
	publicIds: string[];
	usedIn: MediaUse[];
};

export type MediaLibrary =
	| { ok: true; entries: MediaEntry[]; loadedAt: number }
	| { ok: false; message: string };

const folderOf = (publicId: string): MediaFolder => {
	const sub = publicId.split('/').slice(-2, -1)[0] ?? '';
	return sub in MEDIA_FOLDERS && sub !== 'other'
		? (sub as MediaFolder)
		: 'other';
};

const fileName = (publicId: string) => publicId.split('/').pop() ?? publicId;

export async function getMediaLibrary(): Promise<MediaLibrary> {
	await requireAdmin();
	let files: UploadedFile[] | null;
	try {
		files = await listUploads();
	} catch (error) {
		console.error('Media library: Cloudinary listing failed', error);
		return {
			ok: false,
			message:
				'The media library could not be loaded from Cloudinary. Please try again in a minute.',
		};
	}
	if (!files)
		return {
			ok: false,
			message:
				'Cloudinary is not configured (CLOUDINARY_* environment variables).',
		};

	const { products, collections, bannerRings, heroSlides, homeSections } =
		await db();
	const [prods, cols, rings, slides, making] = await Promise.all([
		products.find({}, { projection: { name: 1, images: 1 } }).toArray(),
		collections.find({}, { projection: { title: 1, cover: 1 } }).toArray(),
		bannerRings.find({}, { projection: { name: 1, image: 1 } }).toArray(),
		heroSlides
			.find({}, { projection: { name: 1, photos: 1, spin: 1, model: 1 } })
			.toArray(),
		homeSections.findOne({ _id: 'making' }),
	]);

	// publicId → where it's used; spin frames → their group.
	const uses = new Map<string, MediaUse[]>();
	const addUse = (id: string | undefined, u: MediaUse) => {
		if (!id) return;
		const list = uses.get(id) ?? [];
		if (!list.some((x) => x.label === u.label)) list.push(u);
		uses.set(id, list);
	};
	type Group = { key: string; ids: string[]; use: MediaUse };
	const groups: Group[] = [];
	const spin = (
		key: string,
		frames: { publicId?: string }[] | undefined,
		u: MediaUse,
	) => {
		const ids = (frames ?? [])
			.map((f) => f.publicId)
			.filter((x): x is string => !!x);
		if (ids.length) groups.push({ key, ids, use: u });
	};

	for (const p of prods)
		for (const img of p.images ?? [])
			addUse(img.publicId, {
				label: `Product · ${p.name}`,
				href: `/admin/products/${p._id}`,
			});
	for (const c of cols)
		addUse(c.cover?.publicId, {
			label: `Collection · ${c.title}`,
			href: `/admin/collections/${c._id}`,
		});
	for (const r of rings)
		addUse(r.image?.publicId, {
			label: `Ring showcase · ${r.name}`,
			href: `/admin/banner/${r._id}`,
		});
	for (const s of slides) {
		const href = `/admin/hero/${s._id}`;
		for (const img of s.photos ?? [])
			addUse(img.publicId, { label: `3D banner · ${s.name}`, href });
		addUse(s.model?.publicId, { label: `3D banner · ${s.name}`, href });
		spin(`spin:hero:${s._id}`, s.spin, {
			label: `3D banner · ${s.name}`,
			href,
		});
	}
	if (making) {
		const href = '/admin/making';
		addUse(making.model?.publicId, { label: 'Making section', href });
		spin('spin:making', making.spin, {
			label: 'Making section · 360° video',
			href,
		});
		spin('spin:making-old', making.modelSpin, {
			label: 'Making section · old 3D frames (removed on the next save)',
			href,
		});
	}

	const byId = new Map(files.map((f) => [f.publicId, f]));
	const grouped = new Set<string>();
	const entries: MediaEntry[] = [];

	for (const g of groups) {
		const frames = g.ids
			.map((id) => byId.get(id))
			.filter((f): f is UploadedFile => !!f);
		if (!frames.length) continue;
		frames.forEach((f) => grouped.add(f.publicId));
		entries.push({
			key: g.key,
			type: 'spin',
			folder: folderOf(frames[0].publicId),
			name: `360° spin · ${frames.length} frames`,
			url: frames[0].url,
			preview: frames[0].url,
			bytes: frames.reduce((n, f) => n + f.bytes, 0),
			width: frames[0].width,
			height: frames[0].height,
			format: frames[0].format,
			createdAt: frames
				.map((f) => f.createdAt)
				.sort()
				.at(-1)!,
			frames: frames.length,
			publicIds: frames.map((f) => f.publicId),
			usedIn: [g.use],
		});
	}

	for (const f of files) {
		if (grouped.has(f.publicId)) continue;
		const model = f.resourceType === 'raw';
		entries.push({
			key: f.publicId,
			type: model ? 'model' : 'image',
			folder: folderOf(f.publicId),
			name: fileName(f.publicId),
			url: f.url,
			...(!model && { preview: f.url }),
			bytes: f.bytes,
			width: f.width,
			height: f.height,
			format: f.format ?? (model ? 'glb' : undefined),
			createdAt: f.createdAt,
			publicIds: [f.publicId],
			usedIn: uses.get(f.publicId) ?? [],
		});
	}

	entries.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
	return { ok: true, entries, loadedAt: Date.now() };
}
