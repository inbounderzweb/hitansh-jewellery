'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import type { GalleryImage } from '@/lib/catalogue';

type Props = { images: GalleryImage[]; name: string };

/**
 * Product gallery: large primary image with hover zoom (fine pointers),
 * thumbnail navigation, and a full-screen lightbox with keyboard support.
 */
export default function ProductGallery({ images, name }: Props) {
	const [active, setActive] = useState(0);
	const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null);
	const lightboxRef = useRef<HTMLDialogElement>(null);
	const count = images.length;
	const step = (dir: number) => setActive((i) => (i + dir + count) % count);

	useEffect(() => {
		const dialog = lightboxRef.current;
		if (!dialog) return;
		const sync = () =>
			document.documentElement.classList.toggle(
				'has-dialog',
				dialog.open,
			);
		const observer = new MutationObserver(sync);
		observer.observe(dialog, {
			attributes: true,
			attributeFilter: ['open'],
		});
		return () => {
			observer.disconnect();
			document.documentElement.classList.remove('has-dialog');
		};
	}, []);

	const onLightboxKey = (e: React.KeyboardEvent) => {
		if (e.key === 'ArrowRight') step(1);
		if (e.key === 'ArrowLeft') step(-1);
	};

	const onPointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
		if (e.pointerType !== 'mouse') return;
		const rect = e.currentTarget.getBoundingClientRect();
		setZoom({
			x: ((e.clientX - rect.left) / rect.width) * 100,
			y: ((e.clientY - rect.top) / rect.height) * 100,
		});
	};

	return (
		<div className="pdp-gallery">
			<div
				className="pdp-gallery__thumbs"
				role="group"
				aria-label="Product images"
			>
				{images.map((img, i) => (
					<button
						key={img.src}
						type="button"
						className="pdp-gallery__thumb"
						aria-current={i === active}
						aria-label={`Show image ${i + 1} of ${count}`}
						onClick={() => setActive(i)}
					>
						<Image src={img.src} alt="" fill sizes="96px" />
					</button>
				))}
			</div>

			<button
				type="button"
				className={`pdp-gallery__main${zoom ? ' is-zoomed' : ''}`}
				onClick={() => lightboxRef.current?.showModal()}
				onPointerMove={onPointerMove}
				onPointerLeave={() => setZoom(null)}
				aria-label={`Enlarge image ${active + 1} of ${count}: ${images[active].alt}`}
			>
				{images.map((img, i) => (
					<Image
						key={img.src}
						className="pdp-gallery__img"
						src={img.src}
						alt={i === active ? img.alt : ''}
						fill
						priority={i === 0}
						sizes="(max-width: 900px) 100vw, 56vw"
						data-active={i === active}
						style={
							zoom && i === active
								? { transformOrigin: `${zoom.x}% ${zoom.y}%` }
								: undefined
						}
					/>
				))}
				<span className="pdp-gallery__hint" aria-hidden>
					<svg viewBox="0 0 24 24" fill="none">
						<path
							d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"
							stroke="currentColor"
							strokeWidth="1.2"
						/>
					</svg>
				</span>
			</button>

			<dialog
				ref={lightboxRef}
				className="lightbox"
				aria-label={`${name} — image ${active + 1} of ${count}`}
				onKeyDown={onLightboxKey}
				onClick={(e) => {
					if (e.target === e.currentTarget)
						lightboxRef.current?.close();
				}}
			>
				<div className="lightbox__frame">
					<Image
						key={images[active].src}
						src={images[active].src}
						alt={images[active].alt}
						fill
						sizes="100vw"
						quality={100}
					/>
				</div>
				<p className="lightbox__count" aria-live="polite">
					{active + 1} / {count}
				</p>
				<button
					type="button"
					className="lightbox__close"
					onClick={() => lightboxRef.current?.close()}
					aria-label="Close"
				>
					<svg viewBox="0 0 24 24" aria-hidden>
						<path d="M6 6l12 12M18 6L6 18" />
					</svg>
				</button>
				{count > 1 && (
					<>
						<button
							type="button"
							className="lightbox__nav lightbox__nav--prev"
							onClick={() => step(-1)}
							aria-label="Previous image"
						>
							<svg viewBox="0 0 24 24" aria-hidden>
								<path d="M15 5l-7 7 7 7" />
							</svg>
						</button>
						<button
							type="button"
							className="lightbox__nav lightbox__nav--next"
							onClick={() => step(1)}
							aria-label="Next image"
						>
							<svg viewBox="0 0 24 24" aria-hidden>
								<path d="M9 5l7 7-7 7" />
							</svg>
						</button>
					</>
				)}
			</dialog>
		</div>
	);
}
