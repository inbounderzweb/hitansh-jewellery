/**
 * Site content for Hitansh Fine Jewellery.
 *
 * All copy, product data and contact details live here so they can be edited
 * without touching components.
 *
 * ⚠️  Before launch, replace every value marked `PLACEHOLDER` with real,
 *     client-approved information (contact details, social links and genuine
 *     customer testimonials). Do not publish invented reviews.
 *
 * Product imagery in /public/images/renders is rendered from the site's own
 * 3D ring model (public/assets/scroll-ring-pear.glb), in the gemstone and
 * metal combinations offered by the 3D configurator.
 */

export const brand = {
	name: 'Hitansh',
	fullName: 'Hitansh Fine Jewellery',
	tagline: 'Fine Jewellery',
	description:
		'Hitansh Fine Jewellery — pear-cut halo rings hand-set with diamonds and rare coloured gemstones. Explore every facet and design your own heirloom in 3D.',
} as const;

/** Header / footer navigation. `href` targets are on-page section ids. */
export const navigation = [
	{ label: 'Collections', href: '#collections' },
	{ label: 'The Edit', href: '#showcase' },
	{ label: 'Design in 3D', href: '#view3' },
	{ label: 'Craftsmanship', href: '#craft' },
	{ label: 'The House', href: '#house' },
] as const;

// PLACEHOLDER — replace with the client's real contact details.
export const contact = {
	email: 'appointments@hitansh.example',
	phone: '',
	address: '',
} as const;

// PLACEHOLDER — replace with the client's real profile URLs / handle.
export const social = {
	instagramHandle: '@hitansh',
	instagramUrl: 'https://www.instagram.com/',
} as const;

/* -------------------------------------------------------------------------- */
/* Products                                                                    */
/* -------------------------------------------------------------------------- */

export type ProductCategory =
	'diamond' | 'gemstone' | 'rose-gold' | 'yellow-gold' | 'white-metal';

export type Product = {
	slug: string;
	name: string;
	/**
	 * Catalogue / stock reference. Optional: no references have been supplied
	 * yet, so none are shown. Add the client's real reference to each product
	 * below (e.g. `reference: 'HFJ-0001'`) and it appears on cards, the detail
	 * page and in enquiries automatically.
	 */
	reference?: string;
	design: string;
	gemstone: string;
	metal: string;
	/** Material names exactly as defined in the 3D model's configurator. */
	configurator: { gem: string; metal: string };
	categories: ProductCategory[];
	image: string;
	detailImage: string;
};

const product = (
	slug: string,
	name: string,
	gemstone: string,
	metal: string,
	configurator: Product['configurator'],
	categories: ProductCategory[],
): Product => ({
	slug,
	name,
	design: 'Pear Halo Ring',
	gemstone,
	metal,
	configurator,
	categories,
	image: `/images/renders/product-${slug}.webp`,
	detailImage: `/images/renders/product-${slug}-detail.webp`,
});

export const products: Product[] = [
	product(
		'aurora',
		'Aurora',
		'White Diamond',
		'Platinum',
		{ gem: 'Diamond White', metal: 'Platinum' },
		['diamond', 'white-metal'],
	),
	product(
		'rose-ember',
		'Rose Ember',
		'Ruby',
		'Rose Gold',
		{ gem: 'Ruby', metal: 'Rose Gold' },
		['gemstone', 'rose-gold'],
	),
	product(
		'midnight-sea',
		'Midnight Sea',
		'Sapphire',
		'White Gold',
		{ gem: 'Sapphire', metal: 'White Gold' },
		['gemstone', 'white-metal'],
	),
	product(
		'verdant',
		'Verdant',
		'Emerald',
		'Yellow Gold',
		{ gem: 'Emerald', metal: 'Gold' },
		['gemstone', 'yellow-gold'],
	),
	product(
		'blush',
		'Blush',
		'Pink Diamond',
		'Rose Gold',
		{ gem: 'Diamond Pink', metal: 'Rose Gold' },
		['diamond', 'rose-gold'],
	),
	product(
		'solstice',
		'Solstice',
		'Yellow Sapphire',
		'Yellow Gold',
		{ gem: 'Yellow Sapphire', metal: 'Gold' },
		['gemstone', 'yellow-gold'],
	),
	product(
		'lagoon',
		'Lagoon',
		'Aquamarine',
		'Platinum',
		{ gem: 'Aquamarin', metal: 'Platinum' },
		['gemstone', 'white-metal'],
	),
	product(
		'twilight',
		'Twilight',
		'Amethyst',
		'White Gold',
		{ gem: 'Amethist', metal: 'White Gold' },
		['gemstone', 'white-metal'],
	),
];

export const productFilters: { id: 'all' | ProductCategory; label: string }[] =
	[
		{ id: 'all', label: 'All pieces' },
		{ id: 'diamond', label: 'Diamonds' },
		{ id: 'gemstone', label: 'Coloured gemstones' },
		{ id: 'rose-gold', label: 'Rose gold' },
		{ id: 'yellow-gold', label: 'Yellow gold' },
		{ id: 'white-metal', label: 'White gold & platinum' },
	];

/* -------------------------------------------------------------------------- */
/* Editorial content                                                           */
/* -------------------------------------------------------------------------- */

export const collections = [
	{
		id: 'bridal',
		index: '01',
		title: 'Bridal',
		description:
			'Luminous white diamonds in platinum — for the question, and every anniversary after.',
		image: '/images/renders/collection-bridal.webp',
		filter: 'diamond',
	},
	{
		id: 'gemstones',
		index: '02',
		title: 'Coloured Gemstones',
		description:
			'Rubies, sapphires and emeralds, each framed by a halo of pavé diamonds.',
		image: '/images/renders/collection-gemstones.webp',
		filter: 'gemstone',
	},
	{
		id: 'rose-gold',
		index: '03',
		title: 'The Rose Gold Edit',
		description: 'A warm, romantic glow that flatters every skin tone.',
		image: '/images/renders/collection-rose-gold.webp',
		filter: 'rose-gold',
	},
] as const satisfies readonly {
	id: string;
	index: string;
	title: string;
	description: string;
	image: string;
	filter: ProductCategory;
}[];

/** Facts below are taken from the 3D model's configurator. */
export const signature = {
	gemstoneCount: 16,
	metalCount: 4,
	specs: [
		{ label: 'Centre stone', value: 'Pear cut' },
		{ label: 'Setting', value: 'Pavé diamond halo' },
		{ label: 'Band', value: 'Diamond-set shoulders' },
		{
			label: 'Metals',
			value: 'Platinum · White gold · Yellow gold · Rose gold',
		},
	],
};

/**
 * General jewellery care guidance shown on every product page.
 * PLACEHOLDER — standard fine-jewellery advice; have the client confirm or
 * replace it with their own aftercare policy before launch.
 */
export const jewelleryCare = [
	{
		title: 'Everyday wear',
		text: 'Put your ring on after applying lotions, perfume and cosmetics, and take it off for sport, swimming, gardening and household cleaning.',
	},
	{
		title: 'Cleaning',
		text: 'Soak in warm water with a drop of mild soap, brush gently behind the stone with a soft brush, rinse and pat dry with a lint-free cloth.',
	},
	{
		title: 'Storage',
		text: 'Keep each piece in its own soft pouch or lined compartment so stones and metals cannot scratch one another.',
	},
	{
		title: 'Inspection',
		text: 'Have the setting and claws checked by a jeweller periodically to keep every stone secure.',
	},
];

export const craftSteps = [
	{
		number: '01',
		title: 'Design',
		text: 'Every piece begins as a sketch, refined into a precise 3D model so proportions can be perfected before any metal is touched.',
	},
	{
		number: '02',
		title: 'Sculpt',
		text: 'The design is cast in precious metal, then shaped and refined by hand until every curve flows into the next.',
	},
	{
		number: '03',
		title: 'Set',
		text: 'Stones are selected for fire and colour, then set one by one under magnification so each catches the light.',
	},
	{
		number: '04',
		title: 'Finish',
		text: 'A final polish and careful inspection — the piece is ready only when it is ready to be treasured.',
	},
];

export const gallery = [
	{
		src: '/images/renders/gallery-arch.webp',
		alt: 'A platinum band forming a circle beneath a sapphire halo, seen from below',
		caption: 'The circle — sapphire in platinum',
		width: 900,
		height: 1200,
	},
	{
		src: '/images/renders/gallery-facets.webp',
		alt: 'Macro view of a blue diamond’s facets in a white gold halo',
		caption: 'Facets of a blue diamond',
		width: 1000,
		height: 1000,
	},
	{
		src: '/images/renders/gallery-sunlit.webp',
		alt: 'Yellow sapphire pear halo ring in yellow gold',
		caption: 'Sunlit — yellow sapphire',
		width: 1400,
		height: 900,
	},
	{
		src: '/images/renders/gallery-rose.webp',
		alt: 'Rose tourmaline pear halo ring in rose gold, close up',
		caption: 'Rose tourmaline',
		width: 1000,
		height: 1000,
	},
	{
		src: '/images/renders/gallery-tanzanite.webp',
		alt: 'Tanzanite pear halo ring in platinum from a three-quarter angle',
		caption: 'Tanzanite in platinum',
		width: 900,
		height: 1200,
	},
];

// PLACEHOLDER — sample testimonials for layout only. Replace with genuine,
// attributable client reviews (with permission) before going live.
export const testimonials = [
	{
		quote: 'The ring is even more beautiful in person. Seeing it in 3D first meant there were no surprises — only delight.',
		name: 'Sample client',
		detail: 'Placeholder testimonial',
	},
	{
		quote: 'Designing the stone and metal together made it feel truly ours. Every detail was considered.',
		name: 'Sample client',
		detail: 'Placeholder testimonial',
	},
	{
		quote: 'Exquisite craftsmanship and a calm, personal experience from first conversation to final fitting.',
		name: 'Sample client',
		detail: 'Placeholder testimonial',
	},
];

export const socialImages = [
	{ src: '/images/renders/social-topaz.webp', alt: 'Topaz in yellow gold' },
	{
		src: '/images/renders/social-peridot.webp',
		alt: 'Peridot in white gold',
	},
	{
		src: '/images/renders/social-smoky.webp',
		alt: 'Smoky quartz in rose gold',
	},
	{
		src: '/images/renders/social-cognac.webp',
		alt: 'Cognac diamond ring seen through the band',
	},
	{
		src: '/images/renders/social-canary.webp',
		alt: 'Canary diamond in platinum',
	},
	{
		src: '/images/renders/social-aqua.webp',
		alt: 'Aquamarine in rose gold',
	},
];
