import Link from 'next/link';
import { isInitialised, listCollections } from '@/lib/admin/data';
import Icon from '@/components/admin/Icon';
import CollectionTable from '@/components/admin/CollectionTable';
import SetupBanner from '@/components/admin/SetupBanner';

export const metadata = { title: 'Collections' };

export default async function CollectionsPage() {
	const [rows, initialised] = await Promise.all([
		listCollections(),
		isInitialised(),
	]);
	return (
		<>
			<header className="a-head">
				<div>
					<p className="a-eyebrow">Catalogue</p>
					<h1 className="a-title">Collections</h1>
				</div>
				{initialised && (
					<Link
						href="/admin/collections/new"
						className="a-btn a-btn--gold"
					>
						<Icon name="plus" /> New collection
					</Link>
				)}
			</header>
			{!initialised && <SetupBanner />}
			<p className="a-hint">
				Visible collections appear, in this order, in the home page
				Collections section and as filters on the product listing.
			</p>
			<CollectionTable rows={rows} />
		</>
	);
}
