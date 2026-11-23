'use client';

import { createElement, useEffect } from 'react';

const SCRIPT =
	'https://cdn.jsdelivr.net/npm/@google/model-viewer@3.5.0/dist/model-viewer.min.js';

/**
 * Drag-to-turn preview of an uploaded GLB in the admin, using Google's
 * <model-viewer> (loaded on demand). Close to, but not exactly, the WebGi
 * look on the website.
 */
export default function ModelPreview({ url }: { url: string }) {
	useEffect(() => {
		if (customElements.get('model-viewer')) return;
		if (document.querySelector(`script[src="${SCRIPT}"]`)) return;
		const s = document.createElement('script');
		s.type = 'module';
		s.src = SCRIPT;
		document.head.appendChild(s);
	}, []);

	return createElement('model-viewer', {
		src: url,
		class: 'a-modelpreview',
		'camera-controls': true,
		'auto-rotate': true,
		'shadow-intensity': '0',
		exposure: '1.1',
		'environment-image': 'neutral',
		alt: '3D model preview',
	});
}
