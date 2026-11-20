import Loader from '@/components/Loader';
import Header from '@/components/Header';
import Sections from '@/components/Sections';
import CustomizerFooter from '@/components/CustomizerFooter';
import WebgiViewer from '@/components/WebgiViewer';
import ScrollToTopOnLoad from '@/components/ScrollToTopOnLoad';
import ScrollEffects from '@/components/ScrollEffects';
import BrandStory from '@/components/editorial/BrandStory';
import RingQuartet from '@/components/editorial/RingQuartet';
import RingAtelier from '@/components/editorial/RingAtelier';
import Collections from '@/components/editorial/Collections';
import ProductShowcase from '@/components/editorial/ProductShowcase';
import Signature from '@/components/editorial/Signature';
import Craftsmanship from '@/components/editorial/Craftsmanship';
import Gallery from '@/components/editorial/Gallery';
import Testimonials from '@/components/editorial/Testimonials';
import SocialFeed from '@/components/editorial/SocialFeed';
import Appointment from '@/components/editorial/Appointment';
import SiteFooter from '@/components/SiteFooter';
import {
	getBannerRings,
	getCatalogue,
	getHeroSlides,
	getMakingSection,
} from '@/lib/data/catalogue';

// Catalogue edits refresh this page on demand; this is only a safety net.
export const revalidate = 300;

/**
 * Page structure
 *   1. Loader curtain
 *   2. Fixed header
 *   3. 3D stage: navy backdrop + WebGL ring (fixed) under three scroll
 *      sections (hero, "Forever", 3D studio CTA) and the studio toolbar
 *   4. Editorial layer that scrolls up over the stage
 *
 * Markup is rendered on the server; only the 3D viewer, header, product
 * filtering, testimonials and scroll effects run on the client.
 */
export default async function Home() {
	const [catalogue, bannerRings, heroSlides] = await Promise.all([
		getCatalogue(),
		getBannerRings(),
		getHeroSlides(),
	]);
	const making = await getMakingSection(heroSlides);
	return (
		<>
			<Loader />
			<Header />
			<div className="stage-backdrop" aria-hidden />
			<Sections slides={heroSlides} />
			<CustomizerFooter />
			<WebgiViewer slides={heroSlides} />
			<main id="main-content" className="editorial">
				<BrandStory />
				{making && <RingAtelier {...making} />}
				<RingQuartet rings={bannerRings} />
				<Collections collections={catalogue.collections} />
				<ProductShowcase {...catalogue} />
				<Signature />
				<Craftsmanship />
				<Gallery />
				<Testimonials />
				<SocialFeed />
				<Appointment />
				<SiteFooter />
			</main>
			<ScrollEffects />
			<ScrollToTopOnLoad />
		</>
	);
}
