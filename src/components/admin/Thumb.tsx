import CatalogueImage from '@/components/catalogue/CatalogueImage';

export default function Thumb({
	src,
	size = 48,
}: {
	src?: string;
	size?: number;
}) {
	return (
		<span className="a-thumb" style={{ width: size, height: size }}>
			{src && (
				<CatalogueImage src={src} alt="" fill sizes={`${size * 2}px`} />
			)}
		</span>
	);
}
