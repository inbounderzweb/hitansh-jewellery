import path from 'node:path';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
	// Pin the project root (a stray lockfile exists in the parent folder).
	turbopack: {
		root: path.join(__dirname),
	},
	images: {
		// 75 is the Next.js default; 100 is used for the brand logo so it is
		// not visibly re-compressed compared to the original site.
		qualities: [75, 100],
	},
	// The original static site was also reachable at /index.html.
	async redirects() {
		return [{ source: '/index.html', destination: '/', permanent: true }];
	},
};

export default nextConfig;
