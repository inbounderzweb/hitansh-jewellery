'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import {
	deleteCollection,
	moveCollection,
	setCollectionVisible,
	type ActionResult,
} from '@/app/admin/actions/catalogue';
import type { AdminCollectionRow } from '@/lib/admin/data';
import Icon from './Icon';
import Thumb from './Thumb';
import Toggle from './Toggle';

export default function CollectionTable({
	rows,
}: {
	rows: AdminCollectionRow[];
}) {
	const router = useRouter();
	const [pending, start] = useTransition();
	const [error, setError] = useState('');

	const run = (task: () => Promise<ActionResult>) =>
		start(async () => {
			setError('');
			const res = await task();
			if (!res.ok) setError(res.message ?? 'Something went wrong.');
			router.refresh();
		});

	if (!rows.length) return <p className="a-empty">No collections yet.</p>;

	return (
		<div className="a-card a-card--flush" aria-busy={pending}>
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
							<th scope="col">Collection</th>
							<th scope="col" className="a-hide-sm">
								Pieces
							</th>
							<th scope="col">Visible</th>
							<th scope="col">
								<span className="a-sr">Actions</span>
							</th>
						</tr>
					</thead>
					<tbody>
						{rows.map((c, i) => (
							<tr key={c.id}>
								<td className="a-col-order">
									<div className="a-order">
										<button
											type="button"
											className="a-iconbtn"
											disabled={pending || i === 0}
											onClick={() =>
												run(() =>
													moveCollection(c.id, 'up'),
												)
											}
										>
											<Icon name="up" />
											<span className="a-sr">
												Move {c.title} up
											</span>
										</button>
										<button
											type="button"
											className="a-iconbtn"
											disabled={
												pending || i === rows.length - 1
											}
											onClick={() =>
												run(() =>
													moveCollection(
														c.id,
														'down',
													),
												)
											}
										>
											<Icon name="down" />
											<span className="a-sr">
												Move {c.title} down
											</span>
										</button>
									</div>
								</td>
								<td>
									<Link
										href={`/admin/collections/${c.id}`}
										className="a-prod"
									>
										<Thumb src={c.thumb} size={56} />
										<span>
											<strong>{c.title}</strong>
											<span className="a-muted a-clamp">
												{c.description}
											</span>
										</span>
									</Link>
								</td>
								<td className="a-hide-sm a-muted">
									{c.productCount}
								</td>
								<td>
									<Toggle
										label={`Show ${c.title} on the website`}
										checked={c.visible}
										disabled={pending}
										onChange={(v) =>
											run(() =>
												setCollectionVisible(c.id, v),
											)
										}
									/>
								</td>
								<td className="a-actions">
									<Link
										href={`/admin/collections/${c.id}`}
										className="a-iconbtn"
									>
										<Icon name="edit" />
										<span className="a-sr">
											Edit {c.title}
										</span>
									</Link>
									<button
										type="button"
										className="a-iconbtn a-iconbtn--danger"
										disabled={pending}
										onClick={() => {
											if (
												confirm(
													`Delete the “${c.title}” collection? Its products are kept; they are only removed from this collection.`,
												)
											)
												run(() =>
													deleteCollection(c.id),
												);
										}}
									>
										<Icon name="trash" />
										<span className="a-sr">
											Delete {c.title}
										</span>
									</button>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
}
