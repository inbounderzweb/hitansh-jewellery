import Loader from '@/components/Loader';

// Route-level loading UI. Uses the site's own loader so any streaming
// fallback looks identical to the existing 3D-model loading screen.
export default function Loading() {
	return <Loader />;
}
