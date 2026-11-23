'use client';

import { useId, useState } from 'react';
import { signModelUpload } from '@/app/admin/actions/hero';
import type { ModelAsset } from '@/lib/db/types';
import Icon from './Icon';

const MAX_BYTES = 100 * 1024 * 1024;

const size = (bytes?: number) =>
	!bytes
		? ''
		: bytes < 1024 * 1024
			? `${Math.round(bytes / 1024)} KB`
			: `${(bytes / 1024 / 1024).toFixed(1)} MB`;

/** A GLB file starts with the ASCII bytes "glTF". */
async function isGlb(file: File) {
	const head = new Uint8Array(await file.slice(0, 4).arrayBuffer());
	return String.fromCharCode(...head) === 'glTF';
}

/**
 * Uploads one GLB model straight to Cloudinary (as a raw file) with a
 * short-lived signature from the server, showing progress.
 */
export default function ModelUploader({
	model,
	onChange,
	onUploaded,
	error,
}: {
	model: ModelAsset | null;
	onChange: (model: ModelAsset | null) => void;
	onUploaded: (publicId: string) => void;
	error?: string;
}) {
	const inputId = useId();
	const [progress, setProgress] = useState<number | null>(null);
	const [problem, setProblem] = useState('');

	const upload = async (file: File) => {
		setProblem('');
		if (!/\.glb$/i.test(file.name) || !(await isGlb(file)))
			return setProblem('Choose a .glb file (binary glTF).');
		if (file.size > MAX_BYTES)
			return setProblem(
				'This model is over 100 MB. Use a compressed export.',
			);
		setProgress(0);
		try {
			const sig = await signModelUpload();
			if (!sig.ok) throw new Error(sig.message);
			const s = sig.signature;
			const body = new FormData();
			body.append('file', file);
			body.append('api_key', s.apiKey);
			body.append('timestamp', String(s.timestamp));
			body.append('folder', s.folder);
			body.append('signature', s.signature);
			// XHR (not fetch) for upload progress.
			const data = await new Promise<{
				secure_url?: string;
				public_id?: string;
				bytes?: number;
				error?: { message?: string };
			}>((resolve, reject) => {
				const xhr = new XMLHttpRequest();
				xhr.open(
					'POST',
					`https://api.cloudinary.com/v1_1/${s.cloudName}/raw/upload`,
				);
				xhr.upload.onprogress = (e) => {
					if (e.lengthComputable) setProgress(e.loaded / e.total);
				};
				xhr.onload = () => {
					let json = {};
					try {
						json = JSON.parse(xhr.responseText);
					} catch {}
					resolve(json);
				};
				xhr.onerror = () =>
					reject(
						new Error('The upload failed. Check your connection.'),
					);
				xhr.send(body);
			});
			if (!data.secure_url || !data.public_id)
				throw new Error(
					data.error?.message
						? `Cloudinary: ${data.error.message}`
						: 'The upload failed.',
				);
			onUploaded(data.public_id);
			onChange({
				url: data.secure_url,
				publicId: data.public_id,
				name: file.name.slice(0, 120),
				bytes: data.bytes ?? file.size,
			});
		} catch (e) {
			setProblem(
				e instanceof Error
					? e.message
					: 'The model could not be uploaded.',
			);
		} finally {
			setProgress(null);
		}
	};

	const busy = progress !== null;

	return (
		<div className="a-model">
			{model ? (
				<div className="a-model__file">
					<span className="a-model__icon" aria-hidden>
						<Icon name="ring" />
					</span>
					<span>
						<strong>{model.name || 'Uploaded model'}</strong>
						<span className="a-muted">
							{' '}
							· GLB {size(model.bytes)}
						</span>
					</span>
				</div>
			) : (
				<p className="a-muted">
					No model uploaded — the built-in ring is shown.
				</p>
			)}
			<div className="a-spin__actions">
				<label
					htmlFor={inputId}
					className={`a-btn${busy ? ' is-disabled' : ''}`}
					aria-disabled={busy}
				>
					<Icon name="upload" />
					{model ? 'Replace model' : 'Upload GLB model'}
				</label>
				<input
					id={inputId}
					type="file"
					accept=".glb,model/gltf-binary"
					className="a-sr"
					disabled={busy}
					onChange={(e) => {
						const file = e.target.files?.[0];
						e.target.value = '';
						if (file) void upload(file);
					}}
				/>
				{model && !busy && (
					<button
						type="button"
						className="a-btn"
						onClick={() => onChange(null)}
					>
						Use the built-in ring
					</button>
				)}
			</div>
			{busy && (
				<p className="a-hint" role="status">
					Uploading… {Math.round((progress ?? 0) * 100)}% — keep this
					tab open.
				</p>
			)}
			{(problem || error) && (
				<p className="a-error" role="alert">
					{problem || error}
				</p>
			)}
		</div>
	);
}
