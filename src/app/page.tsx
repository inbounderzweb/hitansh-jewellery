import Loader from '@/components/Loader';
import Header from '@/components/Header';
import Sections from '@/components/Sections';
import CustomizerFooter from '@/components/CustomizerFooter';
import WebgiViewer from '@/components/WebgiViewer';
import ScrollToTopOnLoad from '@/components/ScrollToTopOnLoad';
import ScrollEffects from '@/components/ScrollEffects';
import BrandStory from '@/components/editorial/BrandStory';
import RingQuartet from '@/components/editorial/RingQuartet';
import Collections from '@/components/editorial/Collections';
import ProductShowcase from '@/components/editorial/ProductShowcase';
import Signature from '@/components/editorial/Signature';
import Craftsmanship from '@/components/editorial/Craftsmanship';
import Gallery from '@/components/editorial/Gallery';
import Testimonials from '@/components/editorial/Testimonials';
import SocialFeed from '@/components/editorial/SocialFeed';
import Appointment from '@/components/editorial/Appointment';
import SiteFooter from '@/components/SiteFooter';

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
export default function Home() {
	return (
		<>
			<Loader />
			<Header />
			<div className="stage-backdrop" aria-hidden />
			<Sections />
			<CustomizerFooter />
			<WebgiViewer />
			<main id="main-content" className="editorial">
				<BrandStory />
				<RingQuartet />
				<Collections />
				<ProductShowcase />
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
