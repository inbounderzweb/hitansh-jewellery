/**
 * The home page's scrolling four-ring banner (`#quartet`). Rings are managed
 * in Admin → Ring showcase; until those are imported, the built-in four below
 * are shown.
 */
import { productPath } from '@/lib/catalogue';

/** The banner's choreography is designed for exactly four rings. */
export const BANNER_SLOTS = 4;

export type BannerRing = {
	id: string;
	name: string;
	alt: string;
	image: string;
	/** `#rrggbb` glow colour. */
	glow: string;
	href: string;
};

/** Built-in rings (also the source of the one-off import). */
export const STARTER_RINGS = [
	{
		productSlug: 'aurora',
		name: 'Aurora',
		alt: 'Aurora — White Diamond pear halo ring in Platinum',
		image: '/images/renders/product-aurora.webp',
		glow: '#ecdcb2',
	},
	{
		productSlug: 'rose-ember',
		name: 'Rose Ember',
		alt: 'Rose Ember — Burmese Ruby pear halo ring in Rose Gold',
		image: '/images/renders/product-rose-ember.webp',
		glow: '#e83e62',
	},
	{
		productSlug: 'midnight-sea',
		name: 'Midnight Sea',
		alt: 'Midnight Sea — Kashmir Sapphire pear halo ring in White Gold',
		image: '/images/renders/product-midnight-sea.webp',
		glow: '#3e86f8',
	},
	{
		productSlug: 'verdant',
		name: 'Verdant',
		alt: 'Verdant — Colombian Emerald pear halo ring in Yellow Gold',
		image: '/images/renders/product-verdant.webp',
		glow: '#1acc72',
	},
] as const;

export const staticBannerRings = (): BannerRing[] =>
	STARTER_RINGS.map((r) => ({
		id: r.productSlug,
		name: r.name,
		alt: r.alt,
		image: r.image,
		glow: r.glow,
		href: productPath(r.productSlug),
	}));

export const HEX_COLOUR = /^#[0-9a-f]{6}$/i;

/** `#rrggbb` → translucent `rgba()` for the glow behind a ring. */
export function glowRgba(hex: string, alpha = 0.34) {
	if (!HEX_COLOUR.test(hex)) return `rgba(212, 176, 106, ${alpha})`;
	const n = parseInt(hex.slice(1), 16);
	return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}
