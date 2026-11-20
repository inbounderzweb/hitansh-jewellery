import Link from 'next/link';
import { listEnquiries } from '@/lib/admin/data';
import { ENQUIRY_STATUSES } from '@/lib/db/types';
import Icon from '@/components/admin/Icon';
import StatusSelect from '@/components/admin/StatusSelect';
import { STATUS_LABELS } from '@/components/admin/StatusBadge';
import { formatDateTime } from '@/components/admin/format';

export const metadata = { title: 'Enquiries' };

type Props = {
	searchParams: Promise<{ q?: string; status?: string; page?: string }>;
};

const one = (v: unknown) => (typeof v === 'string' ? v : '');

export default async function EnquiriesPage({ searchParams }: Props) {
	const sp = await searchParams;
	const q = one(sp.q);
	const status = one(sp.status);
	const result = await listEnquiries({
		q,
		status,
		page: Number(one(sp.page)) || 1,
	});

	const href = (patch: Record<string, string | number>) => {
		const params = new URLSearchParams();
		const next = { q, status, page: '', ...patch };
		for (const [k, v] of Object.entries(next))
			if (v && !(k === 'page' && Number(v) <= 1))
				params.set(k, String(v));
		const s = params.toString();
		return `/admin/enquiries${s ? `?${s}` : ''}`;
	};

	return (
		<>
			<header className="a-head">
				<div>
					<p className="a-eyebrow">Customers</p>
					<h1 className="a-title">Enquiries</h1>
				</div>
			</header>

			<div className="a-card a-card--flush">
				<div className="a-toolbar a-toolbar--wrap">
					<nav className="a-tabs" aria-label="Filter by status">
						{['', ...ENQUIRY_STATUSES].map((s) => (
							<Link
								key={s || 'all'}
								href={href({ status: s })}
								className="a-tab"
								aria-current={status === s ? 'page' : undefined}
							>
								{s
									? STATUS_LABELS[
											s as keyof typeof STATUS_LABELS
										]
									: 'All'}
							</Link>
						))}
					</nav>
					<form
						className="a-search"
						role="search"
						action="/admin/enquiries"
					>
						<Icon name="search" />
						{status && (
							<input type="hidden" name="status" value={status} />
						)}
						<label className="a-sr" htmlFor="enquiry-q">
							Search enquiries
						</label>
						<input
							id="enquiry-q"
							type="search"
							name="q"
							defaultValue={q}
							placeholder="Name, email, phone, product, reference…"
						/>
					</form>
				</div>

				{result.rows.length ? (
					<div className="a-table-wrap">
						<table className="a-table">
							<thead>
								<tr>
									<th scope="col">Received</th>
									<th scope="col">Customer</th>
									<th scope="col" className="a-hide-sm">
										Product
									</th>
									<th scope="col">Status</th>
								</tr>
							</thead>
							<tbody>
								{result.rows.map((e) => (
									<tr
										key={e.id}
										className={
											e.status === 'new'
												? 'is-new'
												: undefined
										}
									>
										<td className="a-muted a-nowrap">
											{formatDateTime(e.createdAt)}
										</td>
										<td>
											<Link
												href={`/admin/enquiries/${e.id}`}
												className="a-cell-link"
											>
												<strong>{e.name}</strong>
												<span className="a-muted">
													{e.email}
												</span>
											</Link>
										</td>
										<td className="a-hide-sm">
											{e.product ? (
												<>
													{e.product.name}
													{e.product.reference && (
														<span className="a-muted">
															{' '}
															· Ref.{' '}
															{
																e.product
																	.reference
															}
														</span>
													)}
												</>
											) : (
												<span className="a-muted">
													Consultation
												</span>
											)}
										</td>
										<td>
											<StatusSelect
												id={e.id}
												status={e.status}
												label={`Status of ${e.name}’s enquiry`}
											/>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				) : (
					<p className="a-empty">
						{q || status
							? 'No enquiries match these filters.'
							: 'No enquiries yet. They appear here as soon as a visitor submits the Enquire form.'}
					</p>
				)}

				{result.pages > 1 && (
					<nav className="a-pager" aria-label="Pages">
						<span className="a-muted">
							{result.total} enquiries · page {result.page} of{' '}
							{result.pages}
						</span>
						{result.page > 1 && (
							<Link
								className="a-btn"
								href={href({ page: result.page - 1 })}
							>
								Previous
							</Link>
						)}
						{result.page < result.pages && (
							<Link
								className="a-btn"
								href={href({ page: result.page + 1 })}
							>
								Next
							</Link>
						)}
					</nav>
				)}
			</div>
		</>
	);
}
