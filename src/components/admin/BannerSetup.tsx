'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import {
	importBannerRings,
	startEmptyBanner,
} from '@/app/admin/actions/banner';

/** Shown until the banner rings live in the database. */
export default function BannerSetup() {
	const router = useRouter();
	const [pending, start] = useTransition();
	const [error, setError] = useState('');

	const run = (action: typeof importBannerRings) =>
		start(async () => {
			setError('');
			const res = await action();
			if (res.ok) router.refresh();
			else setError(res.message ?? 'Something went wrong.');
		});

	return (
		<section className="a-banner" aria-labelledby="banner-setup-title">
			<h2 id="banner-setup-title">Set up the banner rings</h2>
			<p>
				The home page banner currently shows the four rings built into
				the code (Aurora, Rose Ember, Midnight Sea and Verdant). Import
				them to manage the banner here; from then on it shows the rings
				you publish in this panel.
			</p>
			{error && (
				<p className="a-alert" role="alert">
					{error}
				</p>
			)}
			<div className="a-banner__actions">
				<button
					type="button"
					className="a-btn a-btn--gold"
					disabled={pending}
					onClick={() => run(importBannerRings)}
				>
					{pending ? 'Working…' : 'Import current rings'}
				</button>
				<button
					type="button"
					className="a-btn"
					disabled={pending}
					onClick={() => {
						if (
							confirm(
								'Start with no rings? The banner is hidden on the website until four visible rings are added.',
							)
						)
							run(startEmptyBanner);
					}}
				>
					Start empty
				</button>
			</div>
		</section>
	);
}
