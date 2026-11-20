'use client';

import Image, { type ImageProps } from 'next/image';
import { cloudinaryLoader, isCloudinaryUrl } from '@/lib/images';

type Props = Omit<ImageProps, 'src' | 'loader'> & { src: string };

/**
 * next/image for catalogue media: Cloudinary images are delivered through
 * Cloudinary's own transformations; bundled images use Next's optimiser.
 */
export default function CatalogueImage({ src, alt, ...props }: Props) {
	return (
		<Image
			src={src}
			alt={alt}
			loader={isCloudinaryUrl(src) ? cloudinaryLoader : undefined}
			{...props}
		/>
	);
}
