import type { ProductCategory } from '@/lib/catalogue';

/** A filter tag, a collection (`collection:<slug>`), or everything. */
export type FilterId = 'all' | ProductCategory | `collection:${string}`;

const EVENT = 'hitansh:product-filter';

export const collectionFilter = (slug: string): FilterId =>
	`collection:${slug}`;

/** Ask the product listing to switch filter (e.g. from a collection). */
export function selectProductFilter(filter: FilterId) {
	window.dispatchEvent(new CustomEvent<FilterId>(EVENT, { detail: filter }));
}

export function onProductFilter(handler: (filter: FilterId) => void) {
	const listener = (event: Event) =>
		handler((event as CustomEvent<FilterId>).detail);
	window.addEventListener(EVENT, listener);
	return () => window.removeEventListener(EVENT, listener);
}
