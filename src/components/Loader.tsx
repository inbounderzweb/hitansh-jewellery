import Image from 'next/image';

/**
 * Full-screen loading curtain shown until the 3D ring has loaded.
 * `.loader` / `.progress` are driven by `setupViewer.ts` (real download
 * progress, then the curtain lifts as the intro begins).
 */
export default function Loader() {
	return (
		<div className="loader" role="status" aria-live="polite">
			<div className="loader__mark">
				<div className="loader__monogram">
					<Image
						src="/brand/hitansh-monogram.png"
						alt=""
						width={444}
						height={510}
						priority
					/>
					<span className="loader__shine" aria-hidden />
				</div>
				<Image
					className="loader__wordmark"
					src="/brand/hitansh-wordmark.png"
					alt="Hitansh"
					width={1204}
					height={206}
					priority
				/>
				<div className="loader__track" aria-hidden>
					<div className="progress"></div>
				</div>
				<p className="loader__label">Preparing your private viewing</p>
			</div>
		</div>
	);
}
