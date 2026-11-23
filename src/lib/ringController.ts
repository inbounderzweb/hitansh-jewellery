/**
 * Hero 4-ring showcase definitions, 3D material presets, and studio bridge.
 *
 * The 3D ring animation is scoped exclusively to the initial hero banner
 * (4 scroll-controlled slides) and the on-demand 3D Studio customizer.
 */

import type { FilterId } from '@/components/editorial/filterEvents';

export type Vec3Tuple = [number, number, number];

export type GemPreset = {
	name: string;
	label: string;
	color: number;
	cssColor: string;
	envMapIntensity: number;
	dispersion: number;
	absorptionFactor: number;
	refractiveIndex: number;
	boostFactors: Vec3Tuple;
};

export type MetalPreset = {
	name: string;
	label: string;
	color: number;
	cssColor: string;
	metalness: number;
	roughness: number;
	envMapIntensity: number;
};

export const GEM_PRESETS: Record<string, GemPreset> = {
	'Diamond White': {
		name: 'Diamond White',
		label: 'White Diamond',
		color: 0xffffff,
		cssColor: '#f5f8ff',
		envMapIntensity: 1.5,
		dispersion: 0.02,
		absorptionFactor: 1.0,
		refractiveIndex: 2.6,
		boostFactors: [1, 1, 1],
	},
	'Diamond Blue': {
		name: 'Diamond Blue',
		label: 'Blue Diamond',
		color: 0x80c9fc,
		cssColor: '#80c9fc',
		envMapIntensity: 1.08,
		dispersion: 0.025,
		absorptionFactor: 1.0,
		refractiveIndex: 2.6,
		boostFactors: [0.9, 1, 1],
	},
	'Diamond Yellow': {
		name: 'Diamond Yellow',
		label: 'Canary Diamond',
		color: 0xfce88c,
		cssColor: '#fce88c',
		envMapIntensity: 1.08,
		dispersion: 0.025,
		absorptionFactor: 1.3,
		refractiveIndex: 2.6,
		boostFactors: [1.2, 1.2, 0.7],
	},
	'Diamond Pink': {
		name: 'Diamond Pink',
		label: 'Pink Diamond',
		color: 0xf1bcd5,
		cssColor: '#f1bcd5',
		envMapIntensity: 1.08,
		dispersion: 0.025,
		absorptionFactor: 1.0,
		refractiveIndex: 2.6,
		boostFactors: [1.3, 1, 1],
	},
	Ruby: {
		name: 'Ruby',
		label: 'Burmese Ruby',
		color: 0xc00e2e,
		cssColor: '#e01e45',
		envMapIntensity: 1.08,
		dispersion: 0.008,
		absorptionFactor: 1.6,
		refractiveIndex: 2.17,
		boostFactors: [1.3, 0.16, 0.9],
	},
	Sapphire: {
		name: 'Sapphire',
		label: 'Kashmir Sapphire',
		color: 0x0b4ca4,
		cssColor: '#2570e8',
		envMapIntensity: 1.08,
		dispersion: 0.01,
		absorptionFactor: 1.3,
		refractiveIndex: 2.17,
		boostFactors: [1, 1, 1.2],
	},
	Emerald: {
		name: 'Emerald',
		label: 'Colombian Emerald',
		color: 0x04bc5d,
		cssColor: '#10c96b',
		envMapIntensity: 1.08,
		dispersion: 0.01,
		absorptionFactor: 1.6,
		refractiveIndex: 1.96,
		boostFactors: [-0.3, 1, 1],
	},
	'Yellow Sapphire': {
		name: 'Yellow Sapphire',
		label: 'Yellow Sapphire',
		color: 0xfcfc89,
		cssColor: '#f7d854',
		envMapIntensity: 1.05,
		dispersion: 0.008,
		absorptionFactor: 0.65,
		refractiveIndex: 2.17,
		boostFactors: [1.4, 0.94, 0.25],
	},
	Tansanit: {
		name: 'Tansanit',
		label: 'Tanzanite',
		color: 0x052999,
		cssColor: '#4f6bf5',
		envMapIntensity: 1.05,
		dispersion: 0.01,
		absorptionFactor: 1.0,
		refractiveIndex: 1.91,
		boostFactors: [1.5, 0.7, 1.4],
	},
	Topaz: {
		name: 'Topaz',
		label: 'Swiss Topaz',
		color: 0x52c9e0,
		cssColor: '#52c9e0',
		envMapIntensity: 1.05,
		dispersion: 0.012,
		absorptionFactor: 1.0,
		refractiveIndex: 2.4,
		boostFactors: [1, 1, 1],
	},
	Peridot: {
		name: 'Peridot',
		label: 'Olive Peridot',
		color: 0x65d741,
		cssColor: '#76e04e',
		envMapIntensity: 1.05,
		dispersion: 0.008,
		absorptionFactor: 0.9,
		refractiveIndex: 2.65,
		boostFactors: [1.4, 1.1, 0.9],
	},
	'Tourmalin Rose': {
		name: 'Tourmalin Rose',
		label: 'Rose Tourmaline',
		color: 0xfc1071,
		cssColor: '#fc3d8a',
		envMapIntensity: 1.05,
		dispersion: 0.008,
		absorptionFactor: 0.82,
		refractiveIndex: 1.64,
		boostFactors: [1, 1, 1.2],
	},
	'Diamond Brown': {
		name: 'Diamond Brown',
		label: 'Cognac Diamond',
		color: 0xf1c08c,
		cssColor: '#d99b66',
		envMapIntensity: 1.05,
		dispersion: 0.025,
		absorptionFactor: 1.3,
		refractiveIndex: 2.6,
		boostFactors: [1, 1, 1],
	},
	'Smoky Quartz': {
		name: 'Smoky Quartz',
		label: 'Smoky Quartz',
		color: 0xa97854,
		cssColor: '#b8845e',
		envMapIntensity: 1.0,
		dispersion: 0.006,
		absorptionFactor: 1.3,
		refractiveIndex: 1.55,
		boostFactors: [1.1, 0.9, 0.7],
	},
	Amethist: {
		name: 'Amethist',
		label: 'Royal Amethyst',
		color: 0xe680fc,
		cssColor: '#d168f7',
		envMapIntensity: 1.05,
		dispersion: 0.008,
		absorptionFactor: 1.3,
		refractiveIndex: 2.22,
		boostFactors: [1, 1, 0.6],
	},
	Aquamarin: {
		name: 'Aquamarin',
		label: 'Aquamarine',
		color: 0xb2fcfc,
		cssColor: '#7ce8f5',
		envMapIntensity: 1.05,
		dispersion: 0.008,
		absorptionFactor: 0.82,
		refractiveIndex: 1.57,
		boostFactors: [1, 1, 1.2],
	},
};

export const METAL_PRESETS: Record<string, MetalPreset> = {
	Platinum: {
		name: 'Platinum',
		label: 'Platinum',
		color: 0x9aa2ad,
		cssColor: '#c5cdd8',
		metalness: 0.88,
		roughness: 0,
		envMapIntensity: 1.0,
	},
	'White Gold': {
		name: 'White Gold',
		label: 'White Gold',
		color: 0xa6acb5,
		cssColor: '#dce2eb',
		metalness: 1.0,
		roughness: 0,
		envMapIntensity: 1.0,
	},
	Gold: {
		name: 'Gold',
		label: 'Yellow Gold',
		color: 0xf38c3b,
		cssColor: '#e8b960',
		metalness: 1.0,
		roughness: 0,
		envMapIntensity: 1.0,
	},
	'Rose Gold': {
		name: 'Rose Gold',
		label: 'Rose Gold',
		color: 0xe27747,
		cssColor: '#e6957a',
		metalness: 1.0,
		roughness: 0,
		envMapIntensity: 1.0,
	},
};

export type HeroRingSlide = {
	index: string;
	id: string;
	collection: string;
	name: string;
	spec: string;
	description: string;
	gem: keyof typeof GEM_PRESETS;
	metal: keyof typeof METAL_PRESETS;
	/** Product filter the "Explore Collection" button applies. */
	filterTarget: FilterId;
	/**
	 * Photo slide: views of the ring shown in turn while scrolling (the 3D
	 * ring is hidden). Absent for a 3D slide.
	 */
	photos?: { url: string; alt: string }[];
	/**
	 * 360° spin slide: frames of one full turn (transparent images), played
	 * by scrolling. The 3D ring is hidden.
	 */
	spin?: string[];
	/**
	 * 3D slide with its own model: URL of a GLB shown instead of the
	 * built-in ring (auto-sized to it; keeps the model's own materials).
	 */
	model?: string;
	/** Ambient radial glow behind the ring (harmonised with Midnight Navy #0E192D) */
	glowPrimary: string;
	glowSecondary: string;
	/** Accent colour for active indicator dot */
	accentColor: string;
	/** Camera orbital presentation for this ring design */
	camera: {
		radius: number;
		mobileRadius: number;
		elevationStart: number;
		elevationPeak: number;
		elevationEnd: number;
		/** Starting azimuth angle in radians */
		startAzimuth: number;
		/** Total angular sweep in radians across this slide (smooth 360° feel) */
		sweepAzimuth: number;
		targetY: number;
	};
};

export const HERO_RING_SLIDES: HeroRingSlide[] = [
	{
		index: '01',
		id: 'aurora',
		collection: 'Bridal Solitaire',
		name: 'Aurora',
		spec: 'White Diamond · Platinum',
		description:
			'An elongated pear-cut white diamond set in hand-polished platinum, framed by a seamless pavé halo.',
		gem: 'Diamond White',
		metal: 'Platinum',
		filterTarget: 'diamond',
		glowPrimary: 'rgba(212, 176, 106, 0.24)',
		glowSecondary: 'rgba(180, 200, 230, 0.14)',
		accentColor: '#ecdcb2',
		camera: {
			radius: 6.4,
			mobileRadius: 11.4,
			elevationStart: 2.3,
			elevationPeak: 1.1,
			elevationEnd: 2.6,
			startAzimuth: -0.35,
			sweepAzimuth: Math.PI * 2,
			targetY: 0.12,
		},
	},
	{
		index: '02',
		id: 'rose-ember',
		collection: 'The Rose Gold Edit',
		name: 'Rose Ember',
		spec: 'Burmese Ruby · 18k Rose Gold',
		description:
			'Velvety crimson ruby cradled in warm rose gold — sculpted to reveal cathedral arches and diamond-set shoulders.',
		gem: 'Ruby',
		metal: 'Rose Gold',
		filterTarget: 'rose-gold',
		glowPrimary: 'rgba(216, 48, 86, 0.26)',
		glowSecondary: 'rgba(226, 138, 102, 0.16)',
		accentColor: '#e85d7a',
		camera: {
			radius: 5.9,
			mobileRadius: 10.8,
			elevationStart: -1.4,
			elevationPeak: 1.85,
			elevationEnd: -0.8,
			startAzimuth: 0.5,
			sweepAzimuth: Math.PI * 2,
			targetY: 0.16,
		},
	},
	{
		index: '03',
		id: 'midnight-sea',
		collection: 'Rare Gemstones',
		name: 'Midnight Sea',
		spec: 'Kashmir Sapphire · White Gold',
		description:
			'Deep royal sapphire with luminous internal fire, elevated in mirror-bright white gold and pavé brilliance.',
		gem: 'Sapphire',
		metal: 'White Gold',
		filterTarget: 'gemstone',
		glowPrimary: 'rgba(42, 114, 232, 0.28)',
		glowSecondary: 'rgba(130, 185, 255, 0.15)',
		accentColor: '#66a3ff',
		camera: {
			radius: 5.7,
			mobileRadius: 10.6,
			elevationStart: 3.1,
			elevationPeak: 0.85,
			elevationEnd: 2.8,
			startAzimuth: -0.9,
			sweepAzimuth: Math.PI * 2,
			targetY: 0.1,
		},
	},
	{
		index: '04',
		id: 'verdant',
		collection: 'Atelier Bespoke',
		name: 'Verdant',
		spec: 'Colombian Emerald · 18k Yellow Gold',
		description:
			'Vivid Colombian emerald set in rich champagne yellow gold — hand-finished to become a generational heirloom.',
		gem: 'Emerald',
		metal: 'Gold',
		filterTarget: 'yellow-gold',
		glowPrimary: 'rgba(20, 188, 108, 0.24)',
		glowSecondary: 'rgba(212, 176, 106, 0.2)',
		accentColor: '#4ad98b',
		camera: {
			radius: 6.1,
			mobileRadius: 11.1,
			elevationStart: 1.4,
			elevationPeak: 2.75,
			elevationEnd: 1.85,
			startAzimuth: 0.2,
			sweepAzimuth: Math.PI * 2,
			targetY: 0.14,
		},
	},
];

/* -------------------------------------------------------------------------- */
/* Studio Open Bridge (allows any button on the site to open the 3D studio)   */
/* -------------------------------------------------------------------------- */

export type OpenStudioPayload = {
	gem?: string;
	metal?: string;
};

type StudioOpenListener = (payload: OpenStudioPayload) => void;
const studioOpenListeners = new Set<StudioOpenListener>();

export function requestOpenStudio(payload: OpenStudioPayload = {}): void {
	studioOpenListeners.forEach((fn) => fn(payload));
}

export function onRequestOpenStudio(fn: StudioOpenListener): () => void {
	studioOpenListeners.add(fn);
	return () => {
		studioOpenListeners.delete(fn);
	};
}
