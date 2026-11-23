import { getMediaLibrary, MEDIA_FOLDERS } from '@/lib/admin/media';
import MediaLibrary from '@/components/admin/MediaLibrary';

export const metadata = { title: 'Media library' };

export default async function MediaPage() {
	const library = await getMediaLibrary();
	return (
		<>
			<header className="a-head">
				<div>
					<p className="a-eyebrow">Cloudinary uploads</p>
					<h1 className="a-title">Media library</h1>
				</div>
			</header>
			<p className="a-hint">
				Every photo, 360° spin and 3D model uploaded from this admin,
				and where each one is used. Files are added from the product,
				collection, banner and section pages; files nothing uses any
				more can be deleted here.
			</p>
			{library.ok ? (
				<MediaLibrary
					entries={library.entries}
					folders={MEDIA_FOLDERS}
					now={library.loadedAt}
				/>
			) : (
				<p className="a-alert" role="alert">
					{library.message}
				</p>
			)}
		</>
	);
}
