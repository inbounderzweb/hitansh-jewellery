import Link from 'next/link';
import { redirect } from 'next/navigation';
import { collectionOptions, isInitialised } from '@/lib/admin/data';
import Icon from '@/components/admin/Icon';
import ProductForm, { EMPTY_PRODUCT } from '@/components/admin/ProductForm';

export const metadata = { title: 'Add product' };

export default async function NewProductPage() {
	if (!(await isInitialised())) redirect('/admin');
	const collections = await collectionOptions();
	return (
		<>
			<header className="a-head">
				<div>
					<Link href="/admin/products" className="a-back">
						<Icon name="back" /> Products
					</Link>
					<h1 className="a-title">Add product</h1>
				</div>
			</header>
			<ProductForm
				id={null}
				initial={EMPTY_PRODUCT}
				collections={collections}
			/>
		</>
	);
}
