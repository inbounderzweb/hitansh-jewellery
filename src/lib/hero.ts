/**
 * The 3D hero banner (`#view1`) slides as data. Client-safe: used by the
 * public page, the 3D viewer and the admin.
 *
 * Each slide recolours the one 3D ring model (gemstone + metal preset) and
 * swaps the copy; the camera choreography comes from the four hand-tuned
 * presets, used in turn.
 */
import type { FilterId } from '@/components/editorial/filterEvents';
import { productFilters } from '@/content/site';
import {
	GEM_PRESETS,
	HERO_RING_SLIDES,
	METAL_PRESETS,
	type HeroRingSlide,
} from './ringController';

export type { HeroRingSlide };

/** Most slides the hero shows; extra visible slides wait in reserve. */
export const HERO_MAX_SLIDES = 6;

export const HERO_LIMITS = {
	name: 40,
	collection: 60,
	description: 260,
} as const;

/** Gemstone and metal presets the 3D model (and its studio) understands. */
export const GEM_OPTIONS = Object.values(GEM_PRESETS).map((g) => ({
	value: g.name,
	label: g.label,
}));
export const METAL_OPTIONS = Object.values(METAL_PRESETS).map((m) => ({
	value: m.name,
	label: m.label,
}));

/** Product filters (not collections) the Explore button can apply. */
export const EXPLORE_FILTERS = productFilters;

export const isProductFilter = (v: string) =>
	productFilters.some((f) => f.id === v);

/** What an admin edits per slide. */
export type HeroSlideData = {
	id: string;
	name: string;
	collection: string;
	description: string;
	gem: string;
	metal: string;
	filterTarget: FilterId;
	/** `#rrggbb` */
	glow: string;
};

const CAMERAS = HERO_RING_SLIDES.map((s) => s.camera);

function rgb(hex: string): [number, number, number] {
	const n = parseInt(hex.slice(1), 16);
	return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** Background glows for a slide, derived from one colour. */
export function heroGlows(hex: string) {
	const [r, g, b] = rgb(hex);
	const soft = (c: number) => Math.round(c + (255 - c) * 0.45);
	return {
		glowPrimary: `rgba(${r}, ${g}, ${b}, 0.26)`,
		glowSecondary: `rgba(${soft(r)}, ${soft(g)}, ${soft(b)}, 0.15)`,
		accentColor: hex,
	};
}

export function toHeroSlides(items: HeroSlideData[]): HeroRingSlide[] {
	return items.slice(0, HERO_MAX_SLIDES).map((s, i) => ({
		index: String(i + 1).padStart(2, '0'),
		id: s.id,
		collection: s.collection,
		name: s.name,
		spec: `${GEM_PRESETS[s.gem]?.label ?? s.gem} · ${METAL_PRESETS[s.metal]?.label ?? s.metal}`,
		description: s.description,
		gem: GEM_PRESETS[s.gem] ? s.gem : 'Diamond White',
		metal: METAL_PRESETS[s.metal] ? s.metal : 'Platinum',
		filterTarget: s.filterTarget,
		...heroGlows(s.glow),
		camera: CAMERAS[i % CAMERAS.length],
	}));
}

/** The slides built into the code, used until the admin takes over. */
export const staticHeroSlides = (): HeroRingSlide[] => HERO_RING_SLIDES;

/** Starter data for "Import current slides" (glow = each slide's main glow). */
export const STARTER_HERO_SLIDES: Omit<HeroSlideData, 'id'>[] = [
	['#d4b06a', 0],
	['#d83056', 1],
	['#2a72e8', 2],
	['#14bc6c', 3],
].map(([glow, i]) => {
	const s = HERO_RING_SLIDES[i as number];
	return {
		name: s.name,
		collection: s.collection,
		description: s.description,
		gem: s.gem,
		metal: s.metal,
		filterTarget: s.filterTarget,
		glow: glow as string,
	};
});
