'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import {
	deleteHeroSlide,
	moveHeroSlide,
	setHeroSlideVisible,
} from '@/app/admin/actions/hero';
import type { ActionResult } from '@/app/admin/actions/catalogue';
import type { HeroSlideRow } from '@/lib/admin/data';
import { HERO_MAX_SLIDES } from '@/lib/hero';
import { GEM_PRESETS, METAL_PRESETS } from '@/lib/ringController';
import Icon from './Icon';
import Thumb from './Thumb';
import Toggle from './Toggle';

export function HeroSwatch({
	gem,
	metal,
	glow,
	size = 48,
}: {
	gem: string;
	metal: string;
	glow: string;
	size?: number;
}) {
	return (
		<span
			className="a-heroswatch"
			style={
				{
					'--hs-gem': GEM_PRESETS[gem]?.cssColor ?? '#fff',
					'--hs-metal': METAL_PRESETS[metal]?.cssColor ?? '#ccc',
					'--hs-glow': glow,
					'--hs-size': `${size}px`,
				} as React.CSSProperties
			}
			aria-hidden
		>
			<span className="a-heroswatch__band" />
			<span className="a-heroswatch__gem" />
		</span>
	);
}

const material = (gem: string, metal: string) =>
	`${GEM_PRESETS[gem]?.label ?? gem} · ${METAL_PRESETS[metal]?.label ?? metal}`;

export default function HeroTable({ rows }: { rows: HeroSlideRow[] }) {
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

	const live = rows
		.filter((r) => r.visible)
		.slice(0, HERO_MAX_SLIDES)
		.map((r) => r.id);

	if (!rows.length) return <p className="a-empty">No slides yet.</p>;

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
							<th scope="col">Slide</th>
							<th scope="col" className="a-hide-sm">
								Display
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
											disabled={pending || i === 0}
											onClick={() =>
												run(() =>
													moveHeroSlide(r.id, 'up'),
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
												pending || i === rows.length - 1
											}
											onClick={() =>
												run(() =>
													moveHeroSlide(r.id, 'down'),
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
										href={`/admin/hero/${r.id}`}
										className="a-prod"
									>
										{r.mode === 'spin' && r.spin[0] ? (
											<Thumb
												src={r.spin[0].url}
												size={48}
											/>
										) : r.mode === 'photos' &&
										  r.photos[0] ? (
											<Thumb
												src={r.photos[0].url}
												size={48}
											/>
										) : (
											<HeroSwatch
												gem={r.gem}
												metal={r.metal}
												glow={r.glow}
											/>
										)}
										<span>
											<strong>{r.name}</strong>
											<span className="a-muted">
												{r.collection || '—'}
											</span>
										</span>
									</Link>
								</td>
								<td className="a-hide-sm a-muted">
									{r.mode === 'spin'
										? `360° spin · ${r.spin.length} frames`
										: r.mode === 'photos'
											? `Photos · ${r.photos.length} view${r.photos.length === 1 ? '' : 's'}`
											: r.model
												? `3D · own model (${r.model.name || 'GLB'})`
												: `3D · ${material(r.gem, r.metal)}`}
								</td>
								<td>
									{live.includes(r.id) ? (
										<span className="a-status a-status--completed">
											Slide {live.indexOf(r.id) + 1}
										</span>
									) : (
										<span className="a-tag">
											{r.visible ? 'Reserve' : 'Hidden'}
										</span>
									)}
								</td>
								<td>
									<Toggle
										label={`Show ${r.name} in the 3D banner`}
										checked={r.visible}
										disabled={pending}
										onChange={(v) =>
											run(() =>
												setHeroSlideVisible(r.id, v),
											)
										}
									/>
								</td>
								<td className="a-actions">
									<Link
										href={`/admin/hero/${r.id}`}
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
													`Delete the “${r.name}” slide? This cannot be undone.`,
												)
											)
												run(() =>
													deleteHeroSlide(r.id),
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
	);
}
