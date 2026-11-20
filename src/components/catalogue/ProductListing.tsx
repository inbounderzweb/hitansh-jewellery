'use client';

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import gsap from 'gsap';
import { Flip } from 'gsap/Flip';
import { productFilters } from '@/content/site';
import { getCollection, type Collection, type Product } from '@/lib/catalogue';
import {
	onProductFilter,
	selectProductFilter,
	type FilterId,
} from '@/components/editorial/filterEvents';
import ProductCard from './ProductCard';

gsap.registerPlugin(Flip);

const SORTS = [
	{ id: 'featured', label: 'Featured' },
	{ id: 'name-asc', label: 'Name: A to Z' },
	{ id: 'name-desc', label: 'Name: Z to A' },
] as const;
type SortId = (typeof SORTS)[number]['id'];

type Props = {
	products: Product[];
	collections: Collection[];
	initialFilter?: FilterId;
	headingLevel?: 'h2' | 'h3';
};

/**
 * Filterable, sortable product grid. Every product stays mounted (filtered
 * ones are `hidden`) so GSAP Flip can animate between layouts.
 */
export default function ProductListing({
	products,
	collections,
	initialFilter = 'all',
	headingLevel,
}: Props) {
	const [filter, setFilter] = useState<FilterId>(initialFilter);
	const [sort, setSort] = useState<SortId>('featured');
	const gridRef = useRef<HTMLDivElement>(null);
	const flipState = useRef<Flip.FlipState | null>(null);

	const captureLayout = () => {
		if (!gridRef.current) return;
		flipState.current = Flip.getState(
			gridRef.current.querySelectorAll('.p-card'),
		);
	};

	const changeFilter = (next: FilterId) => {
		if (next === filter) return;
		captureLayout();
		setFilter(next);
	};

	const changeSort = (next: SortId) => {
		if (next === sort) return;
		captureLayout();
		setSort(next);
	};

	// Collection cards elsewhere on the page can pre-select a filter.
	useEffect(() => onProductFilter(changeFilter));

	// Deep links such as /products?filter=diamond (editorial stories). Read on
	// mount so the page itself stays statically rendered.
	useEffect(() => {
		const requested = new URLSearchParams(window.location.search).get(
			'filter',
		);
		const match =
			productFilters.find((f) => f.id === requested)?.id ??
			(collections.some((c) => `collection:${c.slug}` === requested)
				? (requested as FilterId)
				: undefined);
		if (match) selectProductFilter(match);
		// Only on mount: later changes come from the filter bar.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	useLayoutEffect(() => {
		const state = flipState.current;
		if (!state) return;
		flipState.current = null;
		const reduce = window.matchMedia(
			'(prefers-reduced-motion: reduce)',
		).matches;
		Flip.from(state, {
			duration: reduce ? 0 : 0.7,
			ease: 'power3.inOut',
			absolute: true,
			onEnter: (els) =>
				gsap.fromTo(
					els,
					{ opacity: 0 },
					{ opacity: 1, duration: reduce ? 0 : 0.6, delay: 0.15 },
				),
			onLeave: (els) =>
				gsap.to(els, { opacity: 0, duration: reduce ? 0 : 0.3 }),
		});
	}, [filter, sort]);

	const sorted = useMemo(() => {
		if (sort === 'featured') return products;
		const list = [...products].sort((a, b) => a.name.localeCompare(b.name));
		return sort === 'name-desc' ? list.reverse() : list;
	}, [sort, products]);

	const activeCollection = filter.startsWith('collection:')
		? collections.find((c) => `collection:${c.slug}` === filter)
		: undefined;
	const visible = (p: Product) => {
		if (filter === 'all') return true;
		if (filter.startsWith('collection:'))
			return (
				!!activeCollection &&
				p.collections.includes(activeCollection.slug)
			);
		return (p.tags as string[]).includes(filter);
	};
	const count = products.filter(visible).length;

	return (
		<div className="listing">
			<div className="listing__bar">
				<div
					className="listing__filters"
					role="group"
					aria-label="Filter pieces"
				>
					{productFilters.map((f) => (
						<button
							key={f.id}
							type="button"
							className="listing__filter"
							aria-pressed={filter === f.id}
							onClick={() => changeFilter(f.id)}
						>
							{f.label}
						</button>
					))}
					{activeCollection && (
						<button
							type="button"
							className="listing__filter"
							aria-pressed
							onClick={() => changeFilter('all')}
							aria-label={`${activeCollection.title} collection: show all pieces`}
						>
							{activeCollection.title} ×
						</button>
					)}
				</div>
				<div className="listing__tools">
					<span className="listing__count" aria-live="polite">
						{count} {count === 1 ? 'piece' : 'pieces'}
					</span>
					<label className="listing__sort">
						<span>Sort</span>
						<select
							value={sort}
							onChange={(e) =>
								changeSort(e.target.value as SortId)
							}
						>
							{SORTS.map((s) => (
								<option key={s.id} value={s.id}>
									{s.label}
								</option>
							))}
						</select>
					</label>
				</div>
			</div>

			<div className="p-grid" ref={gridRef}>
				{sorted.map((p) => (
					<ProductCard
						key={p.slug}
						product={p}
						collection={getCollection(p, collections)}
						hidden={!visible(p)}
						headingLevel={headingLevel}
					/>
				))}
			</div>
		</div>
	);
}
