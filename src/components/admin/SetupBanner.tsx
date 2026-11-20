'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import {
	importStarterCatalogue,
	startEmptyCatalogue,
} from '@/app/admin/actions/catalogue';

/**
 * Shown until the catalogue lives in the database. Until then the public
 * website keeps serving the pieces bundled with the code.
 */
export default function SetupBanner() {
	const router = useRouter();
	const [pending, start] = useTransition();
	const [error, setError] = useState('');

	const run = (action: () => ReturnType<typeof startEmptyCatalogue>) =>
		start(async () => {
			setError('');
			const res = await action();
			if (res.ok) router.refresh();
			else setError(res.message ?? 'Something went wrong.');
		});

	return (
		<section className="a-banner" aria-labelledby="setup-title">
			<h2 id="setup-title">Set up the catalogue</h2>
			<p>
				The website is currently showing the 8 pieces and 3 collections
				built into the code. Import them to manage them here; from then
				on, the website shows what you publish in this panel.
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
					onClick={() => run(importStarterCatalogue)}
				>
					{pending ? 'Working…' : 'Import current catalogue'}
				</button>
				<button
					type="button"
					className="a-btn"
					disabled={pending}
					onClick={() => {
						if (
							confirm(
								'Start with an empty catalogue? The website will show no products or collections until you add and publish them.',
							)
						)
							run(startEmptyCatalogue);
					}}
				>
					Start empty
				</button>
			</div>
		</section>
	);
}
