const PATHS = {
	grid: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
	hero: 'M3 5h18v14H3zM12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7z',
	ring: 'M12 8a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13zM9.5 3h5l1.5 2.5L12 8 8 5.5z',
	layers: 'M12 3 3 8l9 5 9-5zM3 13l9 5 9-5M3 17.5l9 5 9-5',
	mail: 'M3 6h18v12H3zM3 6l9 7 9-7',
	external: 'M14 4h6v6M20 4l-9 9M18 14v6H4V6h6',
	logout: 'M15 4h5v16h-5M10 8l-4 4 4 4M6 12h11',
	menu: 'M4 7h16M4 12h16M4 17h16',
	close: 'M6 6l12 12M18 6 6 18',
	plus: 'M12 5v14M5 12h14',
	up: 'M12 19V5M6 11l6-6 6 6',
	down: 'M12 5v14M6 13l6 6 6-6',
	edit: 'M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4',
	trash: 'M5 7h14M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3',
	eye: 'M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
	star: 'M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z',
	upload: 'M12 16V4M7 9l5-5 5 5M4 16v4h16v-4',
	search: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM20 20l-4-4',
	back: 'M19 12H5M11 6l-6 6 6 6',
	sparkle:
		'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 15l.7 2.3L22 18l-2.3.7L19 21l-.7-2.3L16 18l2.3-.7z',
} as const;

export type IconName = keyof typeof PATHS;

export default function Icon({ name }: { name: IconName }) {
	return (
		<svg
			className="a-icon"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="1.5"
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden
		>
			<path d={PATHS[name]} />
		</svg>
	);
}
