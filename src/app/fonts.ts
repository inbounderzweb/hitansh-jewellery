import { Cormorant_Garamond, Hanken_Grotesk } from 'next/font/google';

/**
 * Brand typography
 * ----------------
 * Brand guidelines specify:
 *   - Display: ANTIQUE REGULAR   → headings and prominent brand elements
 *   - Text:    AKTIV GROTESK     → body copy, navigation and UI
 *
 * Both are commercial typefaces whose files are not in this repository yet,
 * so the closest freely-licensed web fonts stand in:
 *   - Cormorant Garamond (display) — high-contrast, flared classical serif
 *   - Hanken Grotesk     (text)    — neutral neo-grotesk like Aktiv Grotesk
 *
 * To switch to the licensed brand fonts:
 *   1. Put the web font files in `src/app/fonts/`, e.g.
 *      Antique-Regular.woff2, AktivGrotesk-Light.woff2,
 *      AktivGrotesk-Regular.woff2, AktivGrotesk-Medium.woff2
 *   2. Replace the two definitions below with `next/font/local`:
 *
 *      import localFont from 'next/font/local';
 *      export const display = localFont({
 *        src: './fonts/Antique-Regular.woff2',
 *        variable: '--font-display',
 *        display: 'swap',
 *      });
 *      export const sans = localFont({
 *        src: [
 *          { path: './fonts/AktivGrotesk-Light.woff2', weight: '300' },
 *          { path: './fonts/AktivGrotesk-Regular.woff2', weight: '400' },
 *          { path: './fonts/AktivGrotesk-Medium.woff2', weight: '500' },
 *        ],
 *        variable: '--font-sans',
 *        display: 'swap',
 *      });
 *
 * Nothing else needs to change — all styles use the CSS variables.
 */

export const display = Cormorant_Garamond({
	weight: ['300', '400', '500'],
	style: ['normal', 'italic'],
	subsets: ['latin'],
	display: 'swap',
	variable: '--font-display',
});

export const sans = Hanken_Grotesk({
	weight: ['300', '400', '500', '600'],
	subsets: ['latin'],
	display: 'swap',
	variable: '--font-sans',
});
