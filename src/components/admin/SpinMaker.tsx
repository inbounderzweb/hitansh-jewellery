'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { signUpload } from '@/app/admin/actions/catalogue';
import type { ImageAsset } from '@/lib/catalogue';
import { cloudinaryUrl, isCloudinaryUrl } from '@/lib/images';
import { SPIN_FRAMES } from '@/lib/hero';
import { framesFromVideo } from '@/lib/spin/fromVideo';
import { uploadToCloudinary } from './ImageManager';
import Icon from './Icon';

const MAX_VIDEO_BYTES = 400 * 1024 * 1024;
const PARALLEL = 4;

const src = (url: string) =>
	isCloudinaryUrl(url) ? cloudinaryUrl(url, { width: 600 }) : url;

/**
 * Builds a 360° spin from a turntable video: the browser extracts and cuts
 * out the frames, then uploads them straight to Cloudinary (the video itself
 * is never uploaded). Shows a drag-to-turn preview of the result.
 */
export default function SpinMaker({
	frames,
	onChange,
	onUploaded,
	error,
}: {
	frames: ImageAsset[];
	onChange: (frames: ImageAsset[]) => void;
	onUploaded: (publicId: string) => void;
	error?: string;
}) {
	const inputId = useId();
	const [status, setStatus] = useState('');
	const [problem, setProblem] = useState('');
	const [busy, setBusy] = useState(false);
	const [turn, setTurn] = useState(0);
	const drag = useRef<{ x: number; start: number } | null>(null);

	// Warm the browser cache so the preview turns smoothly.
	useEffect(() => {
		frames.forEach((f) => {
			const img = new Image();
			img.src = src(f.url);
		});
	}, [frames]);

	const make = async (file: File) => {
		setProblem('');
		if (!file.type.startsWith('video/'))
			return setProblem('Choose a video file (MP4).');
		if (file.size > MAX_VIDEO_BYTES)
			return setProblem(
				'This video is over 400 MB. Use a shorter export.',
			);
		setBusy(true);
		try {
			const sig = await signUpload('hero');
			if (!sig.ok) throw new Error(sig.message);
			setStatus('Reading the video…');
			const { frames: blobs, background } = await framesFromVideo(file, {
				count: SPIN_FRAMES,
				onProgress: ({ done, total }) =>
					setStatus(`Preparing frames ${done} / ${total}…`),
			});
			if (background === 'other')
				setProblem(
					'The video’s background isn’t plain white or black, so it was kept as is. A white or black studio background works best.',
				);
			const uploaded: ImageAsset[] = new Array(blobs.length);
			let done = 0;
			for (let k = 0; k < blobs.length; k += PARALLEL)
				await Promise.all(
					blobs.slice(k, k + PARALLEL).map(async (blob, j) => {
						const asset = await uploadToCloudinary(
							blob,
							sig.signature,
						);
						if (asset.publicId) onUploaded(asset.publicId);
						uploaded[k + j] = asset;
						done++;
						setStatus(
							`Uploading frames ${done} / ${blobs.length}…`,
						);
					}),
				);
			onChange(uploaded.map(({ url, publicId }) => ({ url, publicId })));
			setTurn(0);
			setStatus('');
		} catch (e) {
			setStatus('');
			setProblem(
				e instanceof Error
					? e.message
					: 'The spin could not be created.',
			);
		} finally {
			setBusy(false);
		}
	};

	const n = frames.length;
	const shown = n ? frames[((turn % n) + n) % n] : null;

	return (
		<div className="a-spin">
			{shown ? (
				<div
					className="a-spin__stage"
					role="slider"
					tabIndex={0}
					aria-label="Turn the ring"
					aria-valuemin={0}
					aria-valuemax={n - 1}
					aria-valuenow={((turn % n) + n) % n}
					onKeyDown={(e) => {
						if (e.key === 'ArrowRight') setTurn((t) => t + 1);
						if (e.key === 'ArrowLeft') setTurn((t) => t - 1);
					}}
					onPointerDown={(e) => {
						e.currentTarget.setPointerCapture(e.pointerId);
						drag.current = { x: e.clientX, start: turn };
					}}
					onPointerMove={(e) => {
						if (!drag.current) return;
						const dx = e.clientX - drag.current.x;
						setTurn(drag.current.start - Math.round(dx / 6));
					}}
					onPointerUp={() => (drag.current = null)}
					onPointerCancel={() => (drag.current = null)}
				>
					{/* eslint-disable-next-line @next/next/no-img-element -- frames swap per drag step */}
					<img src={src(shown.url)} alt="" draggable={false} />
					<span className="a-spin__hint">
						<Icon name="back" /> Drag to turn · {n} frames
					</span>
				</div>
			) : (
				<p className="a-muted a-spin__empty">No 360° spin yet.</p>
			)}

			<div className="a-spin__actions">
				<label
					htmlFor={inputId}
					className={`a-btn${busy ? ' is-disabled' : ''}`}
					aria-disabled={busy}
				>
					<Icon name="upload" />
					{n ? 'Replace with another video' : 'Choose 360° video'}
				</label>
				<input
					id={inputId}
					type="file"
					accept="video/mp4,video/quicktime,video/webm"
					className="a-sr"
					disabled={busy}
					onChange={(e) => {
						const file = e.target.files?.[0];
						e.target.value = '';
						if (file) void make(file);
					}}
				/>
				{n > 0 && !busy && (
					<button
						type="button"
						className="a-btn"
						onClick={() => onChange([])}
					>
						Remove spin
					</button>
				)}
			</div>
			{status && (
				<p className="a-hint" role="status">
					{status} Keep this tab open.
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
