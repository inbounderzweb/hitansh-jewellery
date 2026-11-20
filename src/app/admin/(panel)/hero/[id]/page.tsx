import Link from 'next/link';
import { notFound } from 'next/navigation';
import { exploreCollectionOptions, getHeroSlideForm } from '@/lib/admin/data';
import { HERO_MAX_SLIDES } from '@/lib/hero';
import Icon from '@/components/admin/Icon';
import HeroSlideForm from '@/components/admin/HeroSlideForm';

export const metadata = { title: 'Edit banner slide' };

type Props = {
	params: Promise<{ id: string }>;
	searchParams: Promise<{ created?: string }>;
};

export default async function EditHeroSlidePage({
	params,
	searchParams,
}: Props) {
	const { id } = await params;
	const [slide, collections, { created }] = await Promise.all([
		getHeroSlideForm(id),
		exploreCollectionOptions(),
		searchParams,
	]);
	if (!slide) notFound();
	return (
		<>
			<header className="a-head">
				<div>
					<Link href="/admin/hero" className="a-back">
						<Icon name="back" /> 3D banner
					</Link>
					<h1 className="a-title">{slide.name}</h1>
				</div>
			</header>
			{created && (
				<p className="a-success" role="status">
					Slide added
					{slide.visible
						? `. It appears in the 3D banner if it is among the first ${HERO_MAX_SLIDES} visible slides.`
						: '. It is hidden until you make it visible.'}
				</p>
			)}
			<HeroSlideForm
				key={id}
				id={id}
				initial={slide}
				collections={collections}
			/>
		</>
	);
}
