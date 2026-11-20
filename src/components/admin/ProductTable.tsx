'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import {
	deleteProduct,
	moveProduct,
	setProductFlag,
	type ActionResult,
} from '@/app/admin/actions/catalogue';
import type { AdminProductRow } from '@/lib/admin/data';
import Icon from './Icon';
import Thumb from './Thumb';
import Toggle from './Toggle';

export default function ProductTable({ rows }: { rows: AdminProductRow[] }) {
	const router = useRouter();
	const [pending, start] = useTransition();
	const [error, setError] = useState('');
	const [query, setQuery] = useState('');

	const run = (task: () => Promise<ActionResult>) =>
		start(async () => {
			setError('');
			const res = await task();
			if (!res.ok) setError(res.message ?? 'Something went wrong.');
			router.refresh();
		});

	const term = query.trim().toLowerCase();
	const shown = term
		? rows.filter((r) =>
				[r.name, r.reference, r.category, ...r.collections]
					.filter(Boolean)
					.some((v) => v!.toLowerCase().includes(term)),
			)
		: rows;

	if (!rows.length) return <p className="a-empty">No products yet.</p>;

	return (
		<div className="a-card a-card--flush" aria-busy={pending}>
			<div className="a-toolbar">
				<label className="a-search">
					<Icon name="search" />
					<span className="a-sr">Search products</span>
					<input
						type="search"
						placeholder="Search name, reference, collection…"
						value={query}
						onChange={(e) => setQuery(e.target.value)}
					/>
				</label>
				<span className="a-muted">
					{shown.length} of {rows.length}
				</span>
			</div>
			{error && (
				<p className="a-alert a-alert--inset" role="alert">
					{error}
				</p>
			)}
			<div className="a-table-wrap">
				<table className="a-table">
					<thead>
						<tr>
							<th scope="col" className="a-col-order">
								Order
							</th>
							<th scope="col">Product</th>
							<th scope="col" className="a-hide-sm">
								Collections
							</th>
							<th scope="col">Visible</th>
							<th scope="col" className="a-hide-sm">
								Featured
							</th>
							<th scope="col">
								<span className="a-sr">Actions</span>
							</th>
						</tr>
					</thead>
					<tbody>
						{shown.map((r) => {
							const index = rows.indexOf(r);
							return (
								<tr key={r.id}>
									<td className="a-col-order">
										<div className="a-order">
											<button
												type="button"
												className="a-iconbtn"
												disabled={
													pending || index === 0
												}
												onClick={() =>
													run(() =>
														moveProduct(r.id, 'up'),
													)
												}
											>
												<Icon name="up" />
												<span className="a-sr">
													Move {r.name} up
												</span>
											</button>
											<button
												type="button"
												className="a-iconbtn"
												disabled={
													pending ||
													index === rows.length - 1
												}
												onClick={() =>
													run(() =>
														moveProduct(
															r.id,
															'down',
														),
													)
												}
											>
												<Icon name="down" />
												<span className="a-sr">
													Move {r.name} down
												</span>
											</button>
										</div>
									</td>
									<td>
										<Link
											href={`/admin/products/${r.id}`}
											className="a-prod"
										>
											<Thumb src={r.thumb} />
											<span>
												<strong>{r.name}</strong>
												<span className="a-muted">
													{[
														r.reference &&
															`Ref. ${r.reference}`,
														r.category,
													]
														.filter(Boolean)
														.join(' · ')}
												</span>
											</span>
										</Link>
									</td>
									<td className="a-hide-sm a-muted">
										{r.collections.join(', ') || '—'}
									</td>
									<td>
										<Toggle
											label={`Show ${r.name} on the website`}
											checked={r.visible}
											disabled={pending}
											onChange={(v) =>
												run(() =>
													setProductFlag(
														r.id,
														'visible',
														v,
													),
												)
											}
										/>
									</td>
									<td className="a-hide-sm">
										<Toggle
											label={`Feature ${r.name} on the home page`}
											checked={r.featured}
											disabled={pending}
											onChange={(v) =>
												run(() =>
													setProductFlag(
														r.id,
														'featured',
														v,
													),
												)
											}
										/>
									</td>
									<td className="a-actions">
										<Link
											href={`/admin/products/${r.id}`}
											className="a-iconbtn"
										>
											<Icon name="edit" />
											<span className="a-sr">
												Edit {r.name}
											</span>
										</Link>
										<button
											type="button"
											className="a-iconbtn a-iconbtn--danger"
											disabled={pending}
											onClick={() => {
												if (
													confirm(
														`Delete “${r.name}”? This removes it from the website and deletes its uploaded images. This cannot be undone.`,
													)
												)
													run(() =>
														deleteProduct(r.id),
													);
											}}
										>
											<Icon name="trash" />
											<span className="a-sr">
												Delete {r.name}
											</span>
										</button>
									</td>
								</tr>
							);
						})}
					</tbody>
				</table>
			</div>
		</div>
	);
}
