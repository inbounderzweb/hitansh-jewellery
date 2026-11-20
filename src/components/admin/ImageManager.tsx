'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { signUpload, discardUploads } from '@/app/admin/actions/catalogue';
import type { ImageAsset } from '@/lib/catalogue';
import type { UploadKind, UploadSignature } from '@/lib/cloudinary';
import CatalogueImage from '@/components/catalogue/CatalogueImage';
import Icon from './Icon';

const MAX_BYTES = 10 * 1024 * 1024;
const ACCEPT = 'image/jpeg,image/png,image/webp,image/avif';

/** Send one file straight to Cloudinary using a server-issued signature. */
export async function uploadToCloudinary(
	file: Blob,
	sig: UploadSignature,
): Promise<ImageAsset> {
	const body = new FormData();
	body.append('file', file);
	body.append('api_key', sig.apiKey);
	body.append('timestamp', String(sig.timestamp));
	body.append('folder', sig.folder);
	body.append('allowed_formats', sig.allowedFormats);
	body.append('signature', sig.signature);
	const res = await fetch(
		`https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`,
		{ method: 'POST', body },
	);
	const data = (await res.json().catch(() => ({}))) as {
		secure_url?: string;
		public_id?: string;
		width?: number;
		height?: number;
		error?: { message?: string };
	};
	if (!res.ok || !data.secure_url || !data.public_id)
		throw new Error(data.error?.message || `Upload failed (${res.status})`);
	return {
		url: data.secure_url,
		publicId: data.public_id,
		width: data.width,
		height: data.height,
	};
}

type Props = {
	images: ImageAsset[];
	onChange: (images: ImageAsset[]) => void;
	/** Called with each newly uploaded public ID (for clean-up on cancel). */
	onUploaded: (publicId: string) => void;
	/** Public IDs uploaded in this editing session and not yet saved. */
	unsaved: Set<string>;
	kind: UploadKind;
	max: number;
	label: string;
	error?: string;
};

export default function ImageManager({
	images,
	onChange,
	onUploaded,
	unsaved,
	kind,
	max,
	label,
	error,
}: Props) {
	const id = useId();
	const inputRef = useRef<HTMLInputElement>(null);
	const replaceIndex = useRef<number | null>(null);
	const [busy, setBusy] = useState<string>('');
	// Uploads are async: read the latest list when they finish, so edits made
	// meanwhile (alt text, order, removals) are not overwritten.
	const latest = useRef(images);
	useEffect(() => {
		latest.current = images;
	}, [images]);
	const uploading = useRef(false);
	const [uploadError, setUploadError] = useState('');
	const single = max === 1;

	const pick = (replace: number | null) => {
		replaceIndex.current = replace;
		if (inputRef.current) {
			inputRef.current.multiple = replace === null && !single;
			inputRef.current.click();
		}
	};

	/** Removing an image uploaded in this session deletes it right away. */
	const dropUnsaved = (img: ImageAsset | undefined) => {
		if (img?.publicId && unsaved.has(img.publicId))
			void discardUploads([img.publicId]);
	};

	const handleFiles = async (list: FileList | null) => {
		const files = Array.from(list ?? []);
		if (inputRef.current) inputRef.current.value = '';
		if (!files.length || uploading.current) return;
		setUploadError('');

		const replace = replaceIndex.current;
		const room = replace !== null || single ? 1 : max - images.length;
		const accepted = files.slice(0, Math.max(0, room));
		if (files.length > accepted.length)
			setUploadError(`Only ${max} image${max === 1 ? '' : 's'} allowed.`);
		const invalid = accepted.find(
			(f) => !ACCEPT.split(',').includes(f.type) || f.size > MAX_BYTES,
		);
		if (invalid) {
			setUploadError(
				`“${invalid.name}” must be a JPG, PNG, WebP or AVIF under 10 MB.`,
			);
			return;
		}
		if (!accepted.length) return;

		setBusy(
			`Uploading ${accepted.length} image${accepted.length > 1 ? 's' : ''}…`,
		);
		uploading.current = true;
		try {
			const signed = await signUpload(kind);
			if (!signed.ok) throw new Error(signed.message);
			const uploaded: ImageAsset[] = [];
			for (const [i, file] of accepted.entries()) {
				setBusy(`Uploading ${i + 1} of ${accepted.length}…`);
				const asset = await uploadToCloudinary(file, signed.signature);
				onUploaded(asset.publicId!);
				uploaded.push(asset);
			}
			if (single) {
				dropUnsaved(latest.current[0]);
				onChange(uploaded.slice(0, 1));
			} else if (replace !== null) {
				const next = [...latest.current];
				dropUnsaved(next[replace]);
				next[replace] = { ...uploaded[0], alt: next[replace]?.alt };
				onChange(next);
			} else {
				onChange([...latest.current, ...uploaded]);
			}
		} catch (e) {
			setUploadError(e instanceof Error ? e.message : 'Upload failed.');
		} finally {
			uploading.current = false;
			setBusy('');
		}
	};

	const update = (index: number, patch: Partial<ImageAsset>) =>
		onChange(
			images.map((img, i) => (i === index ? { ...img, ...patch } : img)),
		);

	const move = (from: number, to: number) => {
		if (to < 0 || to >= images.length) return;
		const next = [...images];
		const [item] = next.splice(from, 1);
		next.splice(to, 0, item);
		onChange(next);
	};

	const remove = (index: number) => {
		dropUnsaved(images[index]);
		onChange(images.filter((_, i) => i !== index));
	};

	return (
		<fieldset
			className="a-images"
			aria-describedby={error ? `${id}-err` : undefined}
		>
			<legend className="a-label">{label}</legend>
			<input
				ref={inputRef}
				type="file"
				accept={ACCEPT}
				hidden
				onChange={(e) => handleFiles(e.target.files)}
			/>

			{images.length > 0 && (
				<ul
					className={`a-images__grid${single ? ' a-images__grid--single' : ''}`}
				>
					{images.map((img, i) => (
						<li key={img.publicId ?? img.url} className="a-image">
							<div className="a-image__media">
								<CatalogueImage
									src={img.url}
									alt=""
									fill
									sizes="240px"
								/>
								{!single && i === 0 && (
									<span className="a-image__badge">
										Primary
									</span>
								)}
							</div>
							<input
								className="a-image__alt"
								type="text"
								placeholder="Alt text (describe the image)"
								aria-label={`Alt text for image ${i + 1}`}
								value={img.alt ?? ''}
								maxLength={300}
								onChange={(e) =>
									update(i, { alt: e.target.value })
								}
							/>
							<div className="a-image__actions">
								{!single && i > 0 && (
									<button
										type="button"
										className="a-chip"
										onClick={() => move(i, 0)}
									>
										<Icon name="star" /> Make primary
									</button>
								)}
								{!single && (
									<>
										<button
											type="button"
											className="a-iconbtn"
											disabled={i === 0}
											onClick={() => move(i, i - 1)}
										>
											<Icon name="back" />
											<span className="a-sr">
												Move image {i + 1} earlier
											</span>
										</button>
										<button
											type="button"
											className="a-iconbtn a-iconbtn--flip"
											disabled={i === images.length - 1}
											onClick={() => move(i, i + 1)}
										>
											<Icon name="back" />
											<span className="a-sr">
												Move image {i + 1} later
											</span>
										</button>
									</>
								)}
								<button
									type="button"
									className="a-iconbtn"
									disabled={!!busy}
									onClick={() => pick(i)}
								>
									<Icon name="upload" />
									<span className="a-sr">
										Replace image {i + 1}
									</span>
								</button>
								<button
									type="button"
									className="a-iconbtn a-iconbtn--danger"
									onClick={() => remove(i)}
								>
									<Icon name="trash" />
									<span className="a-sr">
										Remove image {i + 1}
									</span>
								</button>
							</div>
						</li>
					))}
				</ul>
			)}

			{(single ? images.length === 0 : images.length < max) && (
				<button
					type="button"
					className="a-drop"
					disabled={!!busy}
					onClick={() => pick(null)}
				>
					<Icon name="upload" />
					<span>
						{busy ||
							(single
								? 'Upload a cover image'
								: images.length
									? 'Add more images'
									: 'Upload images')}
					</span>
					<small>JPG, PNG, WebP or AVIF · up to 10 MB each</small>
				</button>
			)}
			{busy && images.length >= max && <p className="a-muted">{busy}</p>}
			{!single && images.length > 1 && (
				<p className="a-hint">
					The first image is the primary image on cards and the
					product page; the second appears on hover.
				</p>
			)}
			{(uploadError || error) && (
				<p className="a-error" id={`${id}-err`} role="alert">
					{uploadError || error}
				</p>
			)}
		</fieldset>
	);
}
