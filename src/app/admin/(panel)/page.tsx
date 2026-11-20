import Link from 'next/link';
import { dashboardStats, isInitialised } from '@/lib/admin/data';
import Icon from '@/components/admin/Icon';
import Thumb from '@/components/admin/Thumb';
import SetupBanner from '@/components/admin/SetupBanner';
import StatusBadge from '@/components/admin/StatusBadge';
import { formatDate } from '@/components/admin/format';

export const metadata = { title: 'Dashboard' };

export default async function DashboardPage() {
	const [stats, initialised] = await Promise.all([
		dashboardStats(),
		isInitialised(),
	]);

	return (
		<>
			<header className="a-head">
				<div>
					<p className="a-eyebrow">Overview</p>
					<h1 className="a-title">Dashboard</h1>
				</div>
			</header>

			{!initialised && <SetupBanner />}

			<section className="a-stats" aria-label="Summary">
				<Link href="/admin/products" className="a-stat">
					<span className="a-stat__label">Products</span>
					<span className="a-stat__value">{stats.productCount}</span>
					<span className="a-stat__note">
						{stats.visibleProducts} visible on the website
					</span>
				</Link>
				<Link href="/admin/collections" className="a-stat">
					<span className="a-stat__label">Collections</span>
					<span className="a-stat__value">
						{stats.collectionCount}
					</span>
					<span className="a-stat__note">Manage and reorder</span>
				</Link>
				<Link href="/admin/enquiries?status=new" className="a-stat">
					<span className="a-stat__label">New enquiries</span>
					<span className="a-stat__value">{stats.newEnquiries}</span>
					<span className="a-stat__note">Awaiting a reply</span>
				</Link>
			</section>

			{initialised && (
				<section className="a-quick" aria-label="Quick actions">
					<Link
						href="/admin/products/new"
						className="a-btn a-btn--gold"
					>
						<Icon name="plus" /> Add product
					</Link>
					<Link href="/admin/collections/new" className="a-btn">
						<Icon name="plus" /> New collection
					</Link>
					<Link href="/admin/collections" className="a-btn">
						<Icon name="layers" /> Manage collections
					</Link>
					<Link href="/admin/enquiries" className="a-btn">
						<Icon name="mail" /> All enquiries
					</Link>
				</section>
			)}

			<div className="a-split">
				<section className="a-card" aria-labelledby="recent-products">
					<div className="a-card__head">
						<h2 id="recent-products">Recently added</h2>
						<Link href="/admin/products" className="a-link">
							All products
						</Link>
					</div>
					{stats.recentProducts.length ? (
						<ul className="a-list">
							{stats.recentProducts.map((p) => (
								<li key={p.id}>
									<Link
										href={`/admin/products/${p.id}`}
										className="a-list__row"
									>
										<Thumb src={p.thumb} />
										<span className="a-list__main">
											<strong>{p.name}</strong>
											<span>
												{p.category} ·{' '}
												{formatDate(p.createdAt)}
											</span>
										</span>
										{!p.visible && (
											<span className="a-tag">
												Hidden
											</span>
										)}
									</Link>
								</li>
							))}
						</ul>
					) : (
						<p className="a-empty">No products yet.</p>
					)}
				</section>

				<section className="a-card" aria-labelledby="recent-enquiries">
					<div className="a-card__head">
						<h2 id="recent-enquiries">Latest enquiries</h2>
						<Link href="/admin/enquiries" className="a-link">
							All enquiries
						</Link>
					</div>
					{stats.recentEnquiries.length ? (
						<ul className="a-list">
							{stats.recentEnquiries.map((e) => (
								<li key={e.id}>
									<Link
										href={`/admin/enquiries/${e.id}`}
										className="a-list__row"
									>
										<span className="a-list__main">
											<strong>{e.name}</strong>
											<span>
												{e.product
													? `${e.product.name}${e.product.reference ? ` · Ref. ${e.product.reference}` : ''}`
													: 'Consultation'}{' '}
												· {formatDate(e.createdAt)}
											</span>
										</span>
										<StatusBadge status={e.status} />
									</Link>
								</li>
							))}
						</ul>
					) : (
						<p className="a-empty">No enquiries yet.</p>
					)}
				</section>
			</div>
		</>
	);
}
