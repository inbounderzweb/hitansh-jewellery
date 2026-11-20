'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { importHeroSlides } from '@/app/admin/actions/hero';

/** Shown until the 3D banner slides live in the database. */
export default function HeroSetup() {
	const router = useRouter();
	const [pending, start] = useTransition();
	const [error, setError] = useState('');

	const run = () =>
		start(async () => {
			setError('');
			const res = await importHeroSlides();
			if (res.ok) router.refresh();
			else setError(res.message ?? 'Something went wrong.');
		});

	return (
		<section className="a-banner" aria-labelledby="hero-setup-title">
			<h2 id="hero-setup-title">Set up the 3D banner slides</h2>
			<p>
				The 3D banner at the top of the home page currently shows the
				four slides built into the code (Aurora, Rose Ember, Midnight
				Sea and Verdant). Import them to manage the banner here; from
				then on it shows the slides you publish in this panel.
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
					onClick={run}
				>
					{pending ? 'Working…' : 'Import current slides'}
				</button>
			</div>
		</section>
	);
}
