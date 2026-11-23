/**
 * Materials of an uploaded GLB model: its stones become WebGi diamond
 * materials (a plain glTF "glass" stone renders see-through in WebGi) and
 * stones / metals are collected so the stone & metal presets can recolour
 * them. Shared by the hero viewer and the Making-section viewer.
 */
import { DiamondPlugin, GroundPlugin, type ViewerApp } from 'webgi';
import { GEM_PRESETS, METAL_PRESETS } from '@/lib/ringController';

type MeshLike = { isMesh?: boolean; material: unknown };
type MaterialLike = {
	name?: string;
	uuid?: string;
	transmission?: number;
	metalness?: number;
};
type Rgb = { setRGB(r: number, g: number, b: number): void };

export type GemMaterial = {
	color?: Rgb;
	dispersion?: number;
	absorptionFactor?: number;
	refractiveIndex?: number;
	envMapIntensity?: number;
	boostFactors?: { set(x: number, y: number, z: number): void };
	uniformsNeedUpdate?: boolean;
	setDirty?: () => void;
};
export type MetalMaterial = {
	color?: Rgb;
	metalness?: number;
	roughness?: number;
	uniformsNeedUpdate?: boolean;
	setDirty?: () => void;
};

const STONE_NAME =
	/diamond|gem|stone|ruby|sapphire|emerald|crystal|zircon|\bcz\b/i;
const isStone = (m: MaterialLike) =>
	(m.transmission ?? 0) > 0.1 || STONE_NAME.test(m.name ?? '');
const isMetal = (m: MaterialLike) => !isStone(m) && (m.metalness ?? 0) >= 0.5;

const firstMaterial = (o: MeshLike) =>
	(Array.isArray(o.material) ? o.material[0] : o.material) as
		MaterialLike | undefined;

/** Converts the model's stones to diamonds; returns stones and metals. */
export function prepareModelMaterials(
	viewer: ViewerApp,
	nodes: unknown[],
	key: string,
) {
	const meshes: MeshLike[] = [];
	for (const node of nodes)
		(node as { traverse(cb: (o: MeshLike) => void): void }).traverse(
			(o) => {
				if (o.isMesh) meshes.push(o);
			},
		);
	const stoneMeshes = new Set(
		meshes.filter((o) => {
			const m = firstMaterial(o);
			return !!m && isStone(m);
		}),
	);
	const diamonds = viewer.getPlugin(DiamondPlugin);
	const converted = new Set<unknown>();
	for (const mesh of stoneMeshes) {
		const mat = firstMaterial(mesh);
		if (!mat || converted.has(mat)) continue;
		converted.add(mat);
		try {
			diamonds?.makeDiamond(
				mat as never,
				{
					cacheKey: `${key}#${mat.uuid ?? mat.name}`,
					normalMapRes: 512,
				},
				{ isDiamond: true, color: 0xffffff, refractiveIndex: 2.6 },
			);
		} catch (error) {
			console.error('Could not convert a stone material', error);
		}
	}
	// makeDiamond swaps in new materials: collect them after converting.
	const gems: GemMaterial[] = [];
	const metals: MetalMaterial[] = [];
	const seen = new Set<unknown>();
	for (const mesh of meshes) {
		const mat = firstMaterial(mesh);
		if (!mat || seen.has(mat)) continue;
		seen.add(mat);
		if (stoneMeshes.has(mesh)) gems.push(mat as GemMaterial);
		else if (isMetal(mat)) metals.push(mat as MetalMaterial);
	}
	return { gems, metals };
}

/**
 * From now on, ignore the viewer settings a GLB carries (files exported
 * from a WebGi editor embed them: ground, background, lighting…), which
 * WebGi applies when the model is added. Call after loading the built-in
 * ring, whose settings are the website's look; an uploaded ring then only
 * brings its geometry and materials (otherwise e.g. a white ground floor
 * appears under it).
 */
export function ignoreModelViewerSettings(viewer: ViewerApp) {
	const manager = viewer.getManager() as unknown as {
		applyViewerConfig?: (...args: unknown[]) => unknown;
	} | null;
	if (manager?.applyViewerConfig) manager.applyViewerConfig = () => undefined;
}

/**
 * Keeps WebGi's ground floor (a white floor with baked shadows) hidden. The
 * built-in ring's file turns it on, and its settings are applied
 * asynchronously (some wait for the lighting to download), so they can land
 * after the viewer was set up: it is checked before every frame instead.
 */
export function keepGroundHidden(viewer: ViewerApp) {
	const ground = viewer.getPlugin(GroundPlugin);
	if (!ground) return;
	ground.visible = false;
	viewer.addEventListener('preRender', () => {
		if (ground.visible) {
			ground.visible = false;
			viewer.setDirty();
		}
	});
}

type Visible = {
	visible: boolean;
	traverse(cb: (o: { visible: boolean }) => void): void;
};
/** Each object's own visibility, as loaded (some files hide parts). */
const loadedVisibility = new WeakMap<object, boolean>();

/**
 * Shows or hides whole models. WebGi still renders the meshes of a hidden
 * group (its passes check each mesh), so every object is set; showing
 * restores each part's visibility as loaded.
 */
export function setModelVisible(nodes: unknown[], visible: boolean) {
	for (const node of nodes)
		(node as Visible).traverse((o) => {
			if (!loadedVisibility.has(o)) loadedVisibility.set(o, o.visible);
			o.visible = visible && loadedVisibility.get(o)!;
		});
}

const rgb = (hex: number): [number, number, number] => [
	((hex >> 16) & 255) / 255,
	((hex >> 8) & 255) / 255,
	(hex & 255) / 255,
];

/** Applies a stone & metal preset to the given materials. */
export function applyPreset(
	gems: GemMaterial[],
	metals: MetalMaterial[],
	gemKey: string,
	metalKey: string,
) {
	const g = GEM_PRESETS[gemKey] ?? GEM_PRESETS['Diamond White'];
	const m = METAL_PRESETS[metalKey] ?? METAL_PRESETS.Platinum;
	const [gr, gg, gb] = rgb(g.color);
	const [mr, mg, mb] = rgb(m.color);
	for (const gm of gems) {
		gm.color?.setRGB(gr, gg, gb);
		gm.dispersion = g.dispersion;
		gm.absorptionFactor = g.absorptionFactor;
		gm.refractiveIndex = g.refractiveIndex;
		gm.envMapIntensity = g.envMapIntensity;
		gm.boostFactors?.set(...g.boostFactors);
		gm.uniformsNeedUpdate = true;
		gm.setDirty?.();
	}
	for (const mm of metals) {
		mm.color?.setRGB(mr, mg, mb);
		mm.metalness = m.metalness;
		mm.roughness = m.roughness;
		mm.uniformsNeedUpdate = true;
		mm.setDirty?.();
	}
}
