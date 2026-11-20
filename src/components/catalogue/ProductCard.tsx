import Link from 'next/link';
import {
	productMeta,
	productPath,
	type Collection,
	type Product,
} from '@/lib/catalogue';
import CatalogueImage from './CatalogueImage';

type Props = {
	product: Product;
	/** The product's (first) collection, if any. */
	collection?: Collection;
	sizes?: string;
	hidden?: boolean;
	headingLevel?: 'h2' | 'h3';
};

export default function ProductCard({
	product: p,
	collection,
	sizes = '(max-width: 640px) 50vw, (max-width: 1100px) 33vw, 25vw',
	hidden,
	headingLevel: Heading = 'h3',
}: Props) {
	const [primary, alternate] = p.images;
	const meta = productMeta(p);
	return (
		<article className="p-card" hidden={hidden} data-flip-id={p.slug}>
			<div className="p-card__media">
				{primary && (
					<CatalogueImage
						className="p-card__img"
						src={primary.url}
						alt=""
						fill
						sizes={sizes}
					/>
				)}
				{alternate && (
					<CatalogueImage
						className="p-card__img p-card__img--alt"
						src={alternate.url}
						alt=""
						fill
						sizes={sizes}
					/>
				)}
			</div>
			<div className="p-card__body">
				<p className="p-card__kicker">
					{collection?.title}
					<span className="p-card__cat">
						{collection && p.category ? ' · ' : ''}
						{p.category}
					</span>
				</p>
				<Heading className="p-card__name">
					<Link className="p-card__link" href={productPath(p.slug)}>
						{p.name}
					</Link>
				</Heading>
				{meta && <p className="p-card__meta">{meta}</p>}
				{p.reference && (
					<p className="p-card__ref">Ref. {p.reference}</p>
				)}
				<span className="p-card__cta" aria-hidden>
					View details
					<svg viewBox="0 0 24 24" fill="none">
						<path
							d="M4 12h15m-5-5 5 5-5 5"
							stroke="currentColor"
							strokeWidth="1.2"
						/>
					</svg>
				</span>
			</div>
		</article>
	);
}
