'use client';

import { useEffect } from 'react';

/**
 * Replaces the original `<body onload="scrollToTop()">` jQuery handler, which
 * scrolled the document back to the top once the page finished loading.
 */
export default function ScrollToTopOnLoad() {
	useEffect(() => {
		const scrollToTop = () => window.scrollTo({ top: 0, left: 0 });
		if (document.readyState === 'complete') {
			scrollToTop();
			return;
		}
		window.addEventListener('load', scrollToTop, { once: true });
		return () => window.removeEventListener('load', scrollToTop);
	}, []);

	return null;
}
