import Link from 'next/link';
import { redirect } from 'next/navigation';
import { isBannerInitialised, productOptions } from '@/lib/admin/data';
import Icon from '@/components/admin/Icon';
import BannerRingForm, { EMPTY_RING } from '@/components/admin/BannerRingForm';

export const metadata = { title: 'Add banner ring' };

export default async function NewBannerRingPage() {
	if (!(await isBannerInitialised())) redirect('/admin/banner');
	const products = await productOptions();
	return (
		<>
			<header className="a-head">
				<div>
					<Link href="/admin/banner" className="a-back">
						<Icon name="back" /> Ring showcase
					</Link>
					<h1 className="a-title">Add ring</h1>
				</div>
			</header>
			<BannerRingForm
				id={null}
				initial={EMPTY_RING}
				products={products}
			/>
		</>
	);
}
