/**
 * 3D studio toolbar (gemstone / metal). `#configurator` is filled at runtime
 * by `CustomMaterialConfiguratorPlugin` (setupViewer.ts) with the material
 * variations embedded in the 3D model; React never renders into it.
 * The class names below are hooks used by setupViewer.ts — keep them.
 */
export default function CustomizerFooter() {
	return (
		<div
			className="footer-container hidden"
			role="region"
			aria-label="3D ring customiser"
		>
			<div id="configurator"></div>
			<ul className="customizer-toolbar">
				<li>
					<button
						type="button"
						className="footer-diamond-colors customizer-toggle"
					>
						<svg viewBox="0 0 40 40" aria-hidden>
							<path d="M13 8h14l7 9-14 16L6 17l7-9z" />
							<path d="M6 17h28M16 8l-3 9 7 16 7-16-3-9" />
						</svg>
						<span>Gemstone</span>
					</button>
				</li>
				<li>
					<button
						type="button"
						className="footer-ring-colors customizer-toggle"
					>
						<svg viewBox="0 0 40 40" aria-hidden>
							<circle cx="20" cy="20" r="13" />
							<path d="M20 29a9 9 0 0 0 9-9" />
						</svg>
						<span>Metal</span>
					</button>
				</li>
			</ul>
			<p className="customizer-hint">
				Drag to rotate · Scroll or pinch to zoom
			</p>
		</div>
	);
}
