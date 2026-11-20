import Link from 'next/link';
import { isHeroInitialised, listHeroSlides } from '@/lib/admin/data';
import { HERO_MAX_SLIDES } from '@/lib/hero';
import Icon from '@/components/admin/Icon';
import HeroSetup from '@/components/admin/HeroSetup';
import HeroTable from '@/components/admin/HeroTable';

export const metadata = { title: '3D banner' };

export default async function HeroPage() {
	const [rows, initialised] = await Promise.all([
		listHeroSlides(),
		isHeroInitialised(),
	]);
	return (
		<>
			<header className="a-head">
				<div>
					<p className="a-eyebrow">Home page · top</p>
					<h1 className="a-title">3D banner</h1>
				</div>
				{initialised && (
					<Link href="/admin/hero/new" className="a-btn a-btn--gold">
						<Icon name="plus" /> Add slide
					</Link>
				)}
			</header>
			{initialised ? (
				<>
					<p className="a-hint">
						The rotating 3D ring at the top of the home page. As
						visitors scroll it moves through up to {HERO_MAX_SLIDES}{' '}
						visible slides, in this order; each slide recolours the
						ring and changes the text beside it.
					</p>
					<HeroTable rows={rows} />
				</>
			) : (
				<HeroSetup />
			)}
		</>
	);
}
