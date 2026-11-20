import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getBannerRingForm, productOptions } from '@/lib/admin/data';
import Icon from '@/components/admin/Icon';
import BannerRingForm from '@/components/admin/BannerRingForm';

export const metadata = { title: 'Edit banner ring' };

type Props = {
	params: Promise<{ id: string }>;
	searchParams: Promise<{ created?: string }>;
};

export default async function EditBannerRingPage({
	params,
	searchParams,
}: Props) {
	const { id } = await params;
	const [ring, products, { created }] = await Promise.all([
		getBannerRingForm(id),
		productOptions(),
		searchParams,
	]);
	if (!ring) notFound();
	return (
		<>
			<header className="a-head">
				<div>
					<Link href="/admin/banner" className="a-back">
						<Icon name="back" /> Ring showcase
					</Link>
					<h1 className="a-title">{ring.name}</h1>
				</div>
			</header>
			{created && (
				<p className="a-success" role="status">
					Ring added
					{ring.visible
						? '. It appears in the banner if it is among the first four visible rings.'
						: '. It is hidden until you make it visible.'}
				</p>
			)}
			<BannerRingForm
				key={id}
				id={id}
				initial={ring}
				products={products}
			/>
		</>
	);
}
