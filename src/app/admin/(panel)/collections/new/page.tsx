import Link from 'next/link';
import { redirect } from 'next/navigation';
import { isInitialised, productOptions } from '@/lib/admin/data';
import Icon from '@/components/admin/Icon';
import CollectionForm, {
	EMPTY_COLLECTION,
} from '@/components/admin/CollectionForm';

export const metadata = { title: 'New collection' };

export default async function NewCollectionPage() {
	if (!(await isInitialised())) redirect('/admin');
	const products = await productOptions();
	return (
		<>
			<header className="a-head">
				<div>
					<Link href="/admin/collections" className="a-back">
						<Icon name="back" /> Collections
					</Link>
					<h1 className="a-title">New collection</h1>
				</div>
			</header>
			<CollectionForm
				id={null}
				initial={EMPTY_COLLECTION}
				products={products}
			/>
		</>
	);
}
