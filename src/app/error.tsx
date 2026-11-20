'use client';

import { useEffect } from 'react';

// Route-level error boundary, styled with the site's existing loader overlay
// and "Customize it" button classes.
export default function Error({
	error,
	retry,
}: {
	error: unknown;
	retry: () => void;
}) {
	useEffect(() => {
		console.error(error);
	}, [error]);

	return (
		<div className="loader">
			<p>Something went wrong.</p>
			<button className="btn-customize" onClick={() => retry()}>
				Try again
			</button>
		</div>
	);
}
