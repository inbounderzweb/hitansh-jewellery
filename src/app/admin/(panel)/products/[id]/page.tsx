import Link from 'next/link';
import { notFound } from 'next/navigation';
import { collectionOptions, getProductForm } from '@/lib/admin/data';
import Icon from '@/components/admin/Icon';
import ProductForm from '@/components/admin/ProductForm';

export const metadata = { title: 'Edit product' };

type Props = {
	params: Promise<{ id: string }>;
	searchParams: Promise<{ created?: string }>;
};

export default async function EditProductPage({ params, searchParams }: Props) {
	const { id } = await params;
	const [product, collections, { created }] = await Promise.all([
		getProductForm(id),
		collectionOptions(),
		searchParams,
	]);
	if (!product) notFound();

	return (
		<>
			<header className="a-head">
				<div>
					<Link href="/admin/products" className="a-back">
						<Icon name="back" /> Products
					</Link>
					<h1 className="a-title">{product.name}</h1>
				</div>
			</header>
			{created && (
				<p className="a-success" role="status">
					Product created
					{product.visible
						? ' and published on the website.'
						: '. It is hidden until you switch on “Visible on the website”.'}
				</p>
			)}
			<ProductForm
				key={id}
				id={id}
				initial={product}
				collections={collections}
				publicSlug={product.slug}
			/>
		</>
	);
}
