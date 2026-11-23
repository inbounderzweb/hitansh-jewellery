/**
 * Live WebGi viewer for the home page's "Making" section when it shows an
 * uploaded GLB: one canvas over the section, the model loaded once and
 * cloned into four rings that the section moves, scales and turns as the
 * visitor scrolls. Stones become diamonds and take the chosen stone & metal
 * presets, like the 3D banner.
 *
 * The canvas renders on black and is blended over the navy section with
 * `mix-blend-mode: lighten` (like the hero), since WebGi's HDR look can't
 * render a transparent background.
 */
import {
	ViewerApp,
	AssetManagerPlugin,
	TonemapPlugin,
	addBasePlugins,
	mobileAndTabletCheck,
	Box3B,
	Vector3,
} from 'webgi';
import {
	applyPreset,
	ignoreModelViewerSettings,
	keepGroundHidden,
	prepareModelMaterials,
	setModelVisible,
} from './modelMaterials';

type Node = {
	visible: boolean;
	position: Vector3;
	scale: Vector3;
	rotation: { set(x: number, y: number, z: number): void };
	children: Node[];
	parent: { add(n: Node): void } | null;
	clone(): Node;
	updateMatrixWorld(force?: boolean): void;
};

/** Where one ring is drawn, in CSS pixels of the canvas. */
export type RingPose = {
	/** Centre. */
	x: number;
	y: number;
	/** Width of the box the ring fits in. */
	size: number;
	/** Turn around its own vertical axis, in radians. */
	angle: number;
	visible: boolean;
};

export type MakingViewer = {
	setPoses(poses: RingPose[]): void;
	setActive(active: boolean): void;
	dispose(): void;
};

/** The camera looks at the rings slightly from above. */
const TILT = 0.32;
/** The model's longest side, relative to its box (it turns inside it). */
const FIT = 0.78;
const DISTANCE = 10;

export async function createMakingViewer(
	canvas: HTMLCanvasElement,
	model: { url: string; gem: string; metal: string },
	count: number,
): Promise<MakingViewer> {
	const viewer = new ViewerApp({ canvas, useRgbm: true });
	let disposed = false;
	const dispose = () => {
		if (disposed) return;
		disposed = true;
		viewer.renderEnabled = false;
		viewer.dispose();
	};
	try {
		(
			viewer.renderer as unknown as { displayCanvasScaling?: number }
		).displayCanvasScaling = mobileAndTabletCheck()
			? 1
			: Math.min(window.devicePixelRatio || 1, 1.25);
		const manager = await viewer.addPlugin(AssetManagerPlugin);
		await addBasePlugins(viewer);
		const progressive = viewer.getPluginByType('Progressive') as
			{ maxFrameCount?: number } | undefined;
		if (progressive) progressive.maxFrameCount = 6;

		const children = () =>
			[
				...((
					viewer.scene.modelRoot as unknown as {
						modelObject?: { children?: Node[] };
					}
				).modelObject?.children ?? []),
			] as Node[];

		// The built-in ring's file carries the site's studio lighting.
		await manager.addFromPath('/assets/scroll-ring-pear.glb');
		ignoreModelViewerSettings(viewer);
		const studio = children();
		for (let t = 0; t < 150 && !viewer.scene.getEnvironment(); t++)
			await new Promise((r) => setTimeout(r, 100));
		setModelVisible(studio, false);

		await manager.addFromPath(model.url);
		const added = children().filter((n) => !studio.includes(n));
		if (!added.length) throw new Error('The model file is empty.');

		// Re-centre each root's contents on the model's centre and scale it
		// to a longest side of 1, so a root's own transform places the ring.
		for (const n of added) {
			n.position.set(0, 0, 0);
			n.scale.set(1, 1, 1);
			n.rotation.set(0, 0, 0);
			n.updateMatrixWorld(true);
		}
		const bounds = new Box3B().expandByObjects(
			added as never[],
			true,
			false,
		);
		const dims = bounds.getSize(new Vector3());
		const unit = 1 / Math.max(dims.x, dims.y, dims.z, 1e-6);
		const centre = bounds.getCenter(new Vector3());
		for (const n of added)
			for (const c of n.children) c.position.sub(centre);

		const { gems, metals } = prepareModelMaterials(
			viewer,
			added,
			model.url,
		);
		applyPreset(gems, metals, model.gem, model.metal);

		// The other rings share the geometry and materials.
		const rings: Node[][] = [added];
		for (let k = 1; k < count; k++)
			rings.push(
				added.map((n) => {
					const copy = n.clone();
					n.parent?.add(copy);
					return copy;
				}),
			);
		viewer.scene.setDirty({ sceneUpdate: true } as never);

		viewer.getPlugin(TonemapPlugin)!.contrast = 1.06;
		viewer.setBackgroundColor('#000000');
		keepGroundHidden(viewer);
		viewer.renderer.refreshPipeline();

		const camera = viewer.scene.activeCamera;
		camera.setCameraOptions({ controlsEnabled: false });
		camera.position.set(0, 0, DISTANCE);
		camera.target.set(0, 0, 0);
		camera.positionTargetUpdated(true);
		// WebGi fits the near/far planes to the scene's bounds only on some
		// scene updates, so rings that grow and move as the visitor scrolls
		// get clipped. They always stay around the plane the camera looks
		// at: fixed, generous planes instead.
		const scene = viewer.scene as unknown as {
			refreshActiveCameraNearFar?: () => void;
		};
		type Planes = {
			near: number;
			far: number;
			updateProjectionMatrix?: () => void;
		};
		const wrapper = camera as unknown as Planes & { cameraObject?: Planes };
		scene.refreshActiveCameraNearFar = () => {
			for (const c of [wrapper, wrapper.cameraObject])
				if (c) {
					c.near = DISTANCE * 0.1;
					c.far = DISTANCE * 4;
				}
			wrapper.cameraObject?.updateProjectionMatrix?.();
		};
		scene.refreshActiveCameraNearFar();
		const fov =
			((camera as unknown as { cameraObject?: { fov?: number } })
				.cameraObject?.fov ?? 45) *
			(Math.PI / 180);

		let last = '';
		const shown: boolean[] = rings.map(() => true);
		return {
			setPoses(poses) {
				const w = canvas.clientWidth;
				const h = canvas.clientHeight;
				if (!w || !h) return;
				// CSS pixels → world units on the plane the rings turn in.
				const s = (2 * DISTANCE * Math.tan(fov / 2)) / h;
				const key = poses
					.map(
						(p) =>
							`${p.visible ? 1 : 0}${p.x.toFixed(1)},${p.y.toFixed(1)},${p.size.toFixed(1)},${p.angle.toFixed(4)}`,
					)
					.join('|');
				if (key === last) return; // unchanged: let the frame refine
				last = key;
				poses.forEach((p, k) => {
					const ring = rings[k] ?? [];
					if (shown[k] !== p.visible) {
						shown[k] = p.visible;
						setModelVisible(ring, p.visible);
					}
					if (!p.visible) return;
					for (const n of ring) {
						n.position.set((p.x - w / 2) * s, (h / 2 - p.y) * s, 0);
						n.scale.setScalar(p.size * s * FIT * unit);
						n.rotation.set(TILT, p.angle, 0);
						n.updateMatrixWorld(true);
					}
				});
				viewer.setDirty();
			},
			setActive(active) {
				if (viewer.renderEnabled !== active)
					viewer.renderEnabled = active;
			},
			dispose,
		};
	} catch (error) {
		dispose();
		throw error;
	}
}
