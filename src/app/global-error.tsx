'use client';

import { useEffect } from 'react';

// Last-resort error boundary for failures in the root layout. It replaces the
// whole document, so it cannot rely on global styles and uses inline styles.
export default function GlobalError({
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
		<html lang="en">
			<body
				style={{
					margin: 0,
					minHeight: '100vh',
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'center',
					justifyContent: 'center',
					gap: '2em',
					fontFamily: 'sans-serif',
					fontSize: 12,
					color: '#52322b',
				}}
			>
				<title>Realvwr scroll</title>
				<p>Something went wrong.</p>
				<button
					onClick={() => retry()}
					style={{
						background: '#fff',
						height: 50,
						padding: '0 24px',
						border: '1px solid #52322b',
						borderRadius: 58,
						color: '#52322b',
						cursor: 'pointer',
					}}
				>
					Try again
				</button>
			</body>
		</html>
	);
}
