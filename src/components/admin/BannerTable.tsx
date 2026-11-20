'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import {
	deleteBannerRing,
	moveBannerRing,
	setBannerRingVisible,
} from '@/app/admin/actions/banner';
import type { ActionResult } from '@/app/admin/actions/catalogue';
import type { BannerRingRow } from '@/lib/admin/data';
import { BANNER_SLOTS } from '@/lib/banner';
import Icon from './Icon';
import Thumb from './Thumb';
import Toggle from './Toggle';

export default function BannerTable({ rows }: { rows: BannerRingRow[] }) {
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

	// The banner shows the first four visible rings, in this order.
	const live = new Set(
		rows
			.filter((r) => r.visible)
			.slice(0, BANNER_SLOTS)
			.map((r) => r.id),
	);
	const visibleCount = rows.filter((r) => r.visible).length;

	return (
		<>
			{visibleCount < BANNER_SLOTS && (
				<p className="a-alert a-alert--block" role="status">
					The banner needs {BANNER_SLOTS} visible rings and has{' '}
					{visibleCount}, so it is hidden on the website.{' '}
					{rows.length < BANNER_SLOTS
						? 'Add more rings to show it again.'
						: 'Make more rings visible to show it again.'}
				</p>
			)}
			{!rows.length ? (
				<p className="a-empty">No rings yet.</p>
			) : (
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
									<th scope="col">Ring</th>
									<th scope="col" className="a-hide-sm">
										Links to
									</th>
									<th scope="col">On website</th>
									<th scope="col">Visible</th>
									<th scope="col">
										<span className="a-sr">Actions</span>
									</th>
								</tr>
							</thead>
							<tbody>
								{rows.map((r, i) => (
									<tr key={r.id}>
										<td className="a-col-order">
											<div className="a-order">
												<button
													type="button"
													className="a-iconbtn"
													disabled={
														pending || i === 0
													}
													onClick={() =>
														run(() =>
															moveBannerRing(
																r.id,
																'up',
															),
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
														i === rows.length - 1
													}
													onClick={() =>
														run(() =>
															moveBannerRing(
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
												href={`/admin/banner/${r.id}`}
												className="a-prod"
											>
												<Thumb
													src={r.thumb}
													size={56}
												/>
												<span>
													<strong>{r.name}</strong>
													<span className="a-muted a-swatchline">
														<span
															className="a-swatch"
															style={{
																background:
																	r.glow,
															}}
															aria-hidden
														/>
														Glow {r.glow}
													</span>
												</span>
											</Link>
										</td>
										<td className="a-hide-sm a-muted">
											{r.product ?? 'Catalogue page'}
										</td>
										<td>
											{live.has(r.id) ? (
												<span className="a-status a-status--completed">
													Slot{' '}
													{[...live].indexOf(r.id) +
														1}
												</span>
											) : (
												<span className="a-tag">
													{r.visible
														? 'Reserve'
														: 'Hidden'}
												</span>
											)}
										</td>
										<td>
											<Toggle
												label={`Show ${r.name} in the banner`}
												checked={r.visible}
												disabled={pending}
												onChange={(v) =>
													run(() =>
														setBannerRingVisible(
															r.id,
															v,
														),
													)
												}
											/>
										</td>
										<td className="a-actions">
											<Link
												href={`/admin/banner/${r.id}`}
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
															`Delete the “${r.name}” ring? Its uploaded image is deleted too. This cannot be undone.`,
														)
													)
														run(() =>
															deleteBannerRing(
																r.id,
															),
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
								))}
							</tbody>
						</table>
					</div>
				</div>
			)}
		</>
	);
}
