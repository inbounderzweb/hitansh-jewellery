import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCollectionForm, productOptions } from '@/lib/admin/data';
import Icon from '@/components/admin/Icon';
import CollectionForm from '@/components/admin/CollectionForm';

export const metadata = { title: 'Edit collection' };

type Props = {
	params: Promise<{ id: string }>;
	searchParams: Promise<{ created?: string }>;
};

export default async function EditCollectionPage({
	params,
	searchParams,
}: Props) {
	const { id } = await params;
	const [collection, products, { created }] = await Promise.all([
		getCollectionForm(id),
		productOptions(),
		searchParams,
	]);
	if (!collection) notFound();
	return (
		<>
			<header className="a-head">
				<div>
					<Link href="/admin/collections" className="a-back">
						<Icon name="back" /> Collections
					</Link>
					<h1 className="a-title">{collection.title}</h1>
				</div>
			</header>
			{created && (
				<p className="a-success" role="status">
					Collection created
					{collection.visible
						? ' and published on the website.'
						: '. It is hidden until you make it visible.'}
				</p>
			)}
			<CollectionForm
				key={id}
				id={id}
				initial={collection}
				products={products}
			/>
		</>
	);
}
