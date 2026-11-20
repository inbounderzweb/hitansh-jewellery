import Link from 'next/link';
import { isInitialised, listProducts } from '@/lib/admin/data';
import Icon from '@/components/admin/Icon';
import ProductTable from '@/components/admin/ProductTable';
import SetupBanner from '@/components/admin/SetupBanner';

export const metadata = { title: 'Products' };

export default async function ProductsPage() {
	const [rows, initialised] = await Promise.all([
		listProducts(),
		isInitialised(),
	]);
	return (
		<>
			<header className="a-head">
				<div>
					<p className="a-eyebrow">Catalogue</p>
					<h1 className="a-title">Products</h1>
				</div>
				{initialised && (
					<Link
						href="/admin/products/new"
						className="a-btn a-btn--gold"
					>
						<Icon name="plus" /> Add product
					</Link>
				)}
			</header>
			{!initialised && <SetupBanner />}
			<p className="a-hint">
				The order below is the order on the website. Hidden products are
				kept here but not shown publicly; featured products appear in
				the home page edit.
			</p>
			<ProductTable rows={rows} />
		</>
	);
}
