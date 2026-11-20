import type { Metadata, Viewport } from 'next';
import { display, sans } from './fonts';
import { brand } from '@/content/site';
import 'lenis/dist/lenis.css';
import '../styles/tokens.css';
import '../styles/base.css';
import '../styles/motion.css';
import '../styles/header.css';
import '../styles/stage.css';
import '../styles/customizer.css';
import '../styles/editorial.css';
import '../styles/footer.css';
import '../styles/catalogue.css';

/**
 * Canonical site URL. Set NEXT_PUBLIC_SITE_URL in production (e.g.
 * https://www.hitansh.com). On Vercel the production domain is used
 * automatically when the variable is not set.
 */
const siteUrl =
	process.env.NEXT_PUBLIC_SITE_URL ??
	(process.env.VERCEL_PROJECT_PRODUCTION_URL
		? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
		: 'http://localhost:3000');

const title = `${brand.fullName} — Diamond & Gemstone Rings, Designed in 3D`;

export const metadata: Metadata = {
	metadataBase: new URL(siteUrl),
	title: {
		default: title,
		template: `%s · ${brand.fullName}`,
	},
	description: brand.description,
	applicationName: brand.fullName,
	keywords: [
		'Hitansh',
		'Hitansh Fine Jewellery',
		'fine jewellery',
		'pear halo ring',
		'engagement ring',
		'diamond ring',
		'gemstone ring',
		'bespoke jewellery',
		'3D ring configurator',
	],
	alternates: { canonical: '/' },
	openGraph: {
		type: 'website',
		locale: 'en_GB',
		url: '/',
		siteName: brand.fullName,
		title,
		description: brand.description,
		images: [
			{
				url: '/og.jpg',
				width: 1200,
				height: 630,
				alt: 'Hitansh Fine Jewellery — pear halo diamond ring',
			},
		],
	},
	twitter: {
		card: 'summary_large_image',
		title,
		description: brand.description,
		images: ['/og.jpg'],
	},
	robots: { index: true, follow: true },
};

export const viewport: Viewport = {
	width: 'device-width',
	initialScale: 1,
	themeColor: '#0E192D',
	colorScheme: 'dark',
};

const organizationJsonLd = {
	'@context': 'https://schema.org',
	'@type': 'JewelryStore',
	name: brand.fullName,
	description: brand.description,
	url: siteUrl,
	logo: `${siteUrl}/brand/hitansh-logo.png`,
	image: `${siteUrl}/og.jpg`,
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html
			lang="en-GB"
			id="html"
			className={`${display.variable} ${sans.variable}`}
		>
			<body id="body">
				<a className="skip-link" href="#main-content">
					Skip to content
				</a>
				{children}
				<script
					type="application/ld+json"
					// Static, trusted JSON generated above.
					dangerouslySetInnerHTML={{
						__html: JSON.stringify(organizationJsonLd),
					}}
				/>
			</body>
		</html>
	);
}
