import type { ProductCategory } from '@/content/site';

export type FilterId = 'all' | ProductCategory;

const EVENT = 'hitansh:product-filter';

/** Ask the product showcase to switch filter (e.g. from a collection card). */
export function selectProductFilter(filter: FilterId) {
	window.dispatchEvent(new CustomEvent<FilterId>(EVENT, { detail: filter }));
}

export function onProductFilter(handler: (filter: FilterId) => void) {
	const listener = (event: Event) =>
		handler((event as CustomEvent<FilterId>).detail);
	window.addEventListener(EVENT, listener);
	return () => window.removeEventListener(EVENT, listener);
}
