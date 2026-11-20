import Link from 'next/link';
import { isBannerInitialised, listBannerRings } from '@/lib/admin/data';
import Icon from '@/components/admin/Icon';
import BannerSetup from '@/components/admin/BannerSetup';
import BannerTable from '@/components/admin/BannerTable';

export const metadata = { title: 'Ring showcase' };

export default async function BannerPage() {
	const [rows, initialised] = await Promise.all([
		listBannerRings(),
		isBannerInitialised(),
	]);
	return (
		<>
			<header className="a-head">
				<div>
					<p className="a-eyebrow">Home page · below the story</p>
					<h1 className="a-title">Ring showcase</h1>
				</div>
				{initialised && (
					<Link
						href="/admin/banner/new"
						className="a-btn a-btn--gold"
					>
						<Icon name="plus" /> Add ring
					</Link>
				)}
			</header>
			{initialised ? (
				<>
					<p className="a-hint">
						The four ring photos that spread out into a row further
						down the home page (below “We believe fine jewellery…”).
						It shows the first four visible rings, in this order.
						Keep extra rings here as reserves and move them up to
						swap them in. The rotating 3D ring at the top is managed
						under 3D banner.
					</p>
					<BannerTable rows={rows} />
				</>
			) : (
				<BannerSetup />
			)}
		</>
	);
}
