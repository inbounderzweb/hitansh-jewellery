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

/** Most photos (views of the ring) per photo slide. */
export const HERO_MAX_PHOTOS = 6;

/** Frames kept from a 360° video (one every 5°). */
export const SPIN_FRAMES = 72;
/** Most frames accepted for a spin. */
export const SPIN_MAX_FRAMES = 180;

export const HERO_MODES = ['spin', 'photos', '3d'] as const;
export type HeroMode = (typeof HERO_MODES)[number];

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
	mode: HeroMode;
	photos: { url: string; alt?: string }[];
	spin: { url: string }[];
	/** 3D mode: a GLB model replacing the built-in ring. */
	model?: { url: string } | null;
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
	// 3D slides take the hand-tuned camera moves in turn.
	let cameraTurn = 0;
	return items.slice(0, HERO_MAX_SLIDES).map((s, i) => {
		const photos =
			s.mode === 'photos' && s.photos.length
				? s.photos.slice(0, HERO_MAX_PHOTOS).map((p, v) => ({
						url: p.url,
						alt: p.alt || `${s.name} — view ${v + 1}`,
					}))
				: undefined;
		const spin =
			s.mode === 'spin' && s.spin.length
				? s.spin.slice(0, SPIN_MAX_FRAMES).map((f) => f.url)
				: undefined;
		const model = s.mode === '3d' && s.model?.url ? s.model.url : undefined;
		const camera =
			CAMERAS[(photos || spin ? 0 : cameraTurn++) % CAMERAS.length];
		return {
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
			camera,
			...(photos && { photos }),
			...(spin && { spin }),
			...(model && { model }),
		};
	});
}

/** The client's first ring, shown as photos (views in `public/images/hero`). */
const DOME_BAND: Omit<HeroSlideData, 'id'> = {
	name: 'Dome Pavé',
	collection: 'Diamond Bands',
	description:
		'Three rows of brilliant-cut diamonds crowning a sculpted dome of 18k yellow gold — made to be worn every day.',
	gem: 'Diamond White',
	metal: 'Gold',
	filterTarget: 'diamond',
	glow: '#d4b06a',
	mode: 'spin',
	spin: Array.from({ length: SPIN_FRAMES }, (_, i) => ({
		url: `/images/hero/dome-band/spin/frame-${String(i).padStart(2, '0')}.webp`,
	})),
	photos: [1, 2, 3, 4].map((n) => ({
		url: `/images/hero/dome-band/view-${n}.webp`,
		alt: `Dome Pavé diamond band in yellow gold — view ${n}`,
	})),
};

/** Starter data for "Import current slides" (glow = each slide's main glow). */
export const STARTER_HERO_SLIDES: Omit<HeroSlideData, 'id'>[] = [
	DOME_BAND,
	...(
		[
			['#d4b06a', 0],
			['#d83056', 1],
			['#2a72e8', 2],
			['#14bc6c', 3],
		] as const
	).map(([glow, i]) => {
		const s = HERO_RING_SLIDES[i];
		return {
			name: s.name,
			collection: s.collection,
			description: s.description,
			gem: s.gem,
			metal: s.metal,
			filterTarget: s.filterTarget,
			glow,
			mode: '3d' as const,
			photos: [],
			spin: [],
		};
	}),
];

/** The slides built into the code, used until the admin takes over. */
export const staticHeroSlides = (): HeroRingSlide[] => {
	const [dome] = toHeroSlides([{ ...DOME_BAND, id: 'dome-pave' }]);
	// The original 3D slides keep their exact look; only the numbering moves.
	return [dome, ...HERO_RING_SLIDES].map((s, i) => ({
		...s,
		index: String(i + 1).padStart(2, '0'),
	}));
};
