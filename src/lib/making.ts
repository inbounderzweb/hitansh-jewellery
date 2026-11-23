/**
 * The home page's "Making" section (`#making`): one ring turning centre
 * stage that splits into four rings, one per craft stage. Managed in
 * Admin → Making section; client-safe (no server imports).
 */
import { craftSteps } from '@/content/site';

export const MAKING_STAGES = 4;

export const MAKING_LIMITS = {
	eyebrow: 60,
	heading: 140,
	stage: 24,
} as const;

/**
 * Where the turning ring comes from:
 *  - `banner`: the first 360° slide of the 3D banner;
 *  - `own`:    a 360° video uploaded for this section;
 *  - `model`:  a GLB model, shown live in 3D with the chosen colours.
 */
export type MakingSource = 'banner' | 'own' | 'model';

export const DEFAULT_MAKING_GEM = 'Diamond White';
export const DEFAULT_MAKING_METAL = 'Gold';

/** What the public section renders. */
export type MakingContent = {
	eyebrow: string;
	/** `*words*` are shown in gold italics. */
	heading: string;
	stages: string[];
	/** 360° frames: the ring itself, or the fallback when `model` is set. */
	frames: string[];
	/** A GLB rendered live (stone & metal preset keys). */
	model?: { url: string; gem: string; metal: string } | null;
};

export const DEFAULT_MAKING_HEADING =
	'From a first sketch to the final polish, *four stages* shape every piece.';

export const DEFAULT_MAKING_STAGES = craftSteps
	.slice(0, MAKING_STAGES)
	.map((s) => s.title);

export const makingEyebrow = (ringName: string) =>
	ringName ? `The making of ${ringName}` : 'The making';

/** Splits `*accent*` markup into plain and accented parts. */
export function splitAccent(text: string) {
	return text
		.split(/(\*[^*]+\*)/)
		.filter(Boolean)
		.map((part) =>
			part.length > 2 && part.startsWith('*') && part.endsWith('*')
				? { text: part.slice(1, -1), accent: true }
				: { text: part.replaceAll('*', ''), accent: false },
		);
}
