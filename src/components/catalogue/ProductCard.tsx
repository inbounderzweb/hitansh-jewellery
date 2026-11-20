import Image from 'next/image';
import Link from 'next/link';
import type { Product } from '@/content/site';
import { getCollection, productCategory, productPath } from '@/lib/catalogue';

type Props = {
	product: Product;
	sizes?: string;
	hidden?: boolean;
	headingLevel?: 'h2' | 'h3';
};

export default function ProductCard({
	product: p,
	sizes = '(max-width: 640px) 50vw, (max-width: 1100px) 33vw, 25vw',
	hidden,
	headingLevel: Heading = 'h3',
}: Props) {
	const collection = getCollection(p);
	return (
		<article className="p-card" hidden={hidden} data-flip-id={p.slug}>
			<div className="p-card__media">
				<Image
					className="p-card__img"
					src={p.image}
					alt=""
					fill
					sizes={sizes}
				/>
				<Image
					className="p-card__img p-card__img--alt"
					src={p.detailImage}
					alt=""
					fill
					sizes={sizes}
				/>
			</div>
			<div className="p-card__body">
				<p className="p-card__kicker">
					{collection?.title}
					<span className="p-card__cat">
						{collection ? ' · ' : ''}
						{productCategory(p)}
					</span>
				</p>
				<Heading className="p-card__name">
					<Link className="p-card__link" href={productPath(p.slug)}>
						{p.name}
					</Link>
				</Heading>
				<p className="p-card__meta">
					{p.gemstone} · {p.metal}
				</p>
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
