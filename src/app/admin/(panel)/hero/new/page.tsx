import Link from 'next/link';
import { redirect } from 'next/navigation';
import { exploreCollectionOptions, isHeroInitialised } from '@/lib/admin/data';
import Icon from '@/components/admin/Icon';
import HeroSlideForm, { EMPTY_SLIDE } from '@/components/admin/HeroSlideForm';

export const metadata = { title: 'Add banner slide' };

export default async function NewHeroSlidePage() {
	if (!(await isHeroInitialised())) redirect('/admin/hero');
	const collections = await exploreCollectionOptions();
	return (
		<>
			<header className="a-head">
				<div>
					<Link href="/admin/hero" className="a-back">
						<Icon name="back" /> 3D banner
					</Link>
					<h1 className="a-title">Add slide</h1>
				</div>
			</header>
			<HeroSlideForm
				id={null}
				initial={EMPTY_SLIDE}
				collections={collections}
			/>
		</>
	);
}
