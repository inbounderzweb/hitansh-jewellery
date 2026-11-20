/**
 * WebGi 3D viewer — Hero 4-Ring Scroll Showcase & On-Demand 3D Studio.
 *
 * The 3D ring animation is scoped exclusively to:
 *   1. The initial 4-slide hero showcase (`#view1`), where vertical scrolling
 *      smoothly rotates and transitions through 4 distinct ring designs
 *      centred in the viewport.
 *   2. The on-demand 3D Studio customizer overlay (launched from any
 *      "Design in 3D" / "Customise in 3D" / "View in 3D studio" button).
 *
 * Once the user scrolls past the 4th hero slide into the editorial sections,
 * `viewer.renderEnabled` is turned off for 0% background GPU load.
 */
import {
	ViewerApp,
	AssetManagerPlugin,
	TonemapPlugin,
	mobileAndTabletCheck,
	CameraViewPlugin,
	MaterialConfiguratorBasePlugin,
	addBasePlugins,
	EasingFunctions,
	GroundPlugin,
} from 'webgi';

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { createSmoothScroll, destroySmoothScroll } from './smoothScroll';
import {
	GEM_PRESETS,
	METAL_PRESETS,
	onRequestOpenStudio,
	type HeroRingSlide,
	type Vec3Tuple,
} from '@/lib/ringController';

gsap.registerPlugin(ScrollTrigger);
ScrollTrigger.config({ ignoreMobileResize: true });

const STAGE_KEY_COLOR = '#000000';

const MATERIAL_LABELS: Record<string, string> = {
	Amethist: 'Amethyst',
	Aquamarin: 'Aquamarine',
	Tansanit: 'Tanzanite',
	'Tourmalin Rose': 'Rose Tourmaline',
	Gold: 'Yellow Gold',
};
const displayName = (name: string) => MATERIAL_LABELS[name] ?? name;

function hexToRgb(hex: number): Vec3Tuple {
	return [
		((hex >> 16) & 0xff) / 255,
		((hex >> 8) & 0xff) / 255,
		(hex & 0xff) / 255,
	];
}

function lerp(a: number, b: number, t: number): number {
	return a + (b - a) * t;
}

function clamp(v: number, min: number, max: number): number {
	return Math.max(min, Math.min(max, v));
}

function smoothstep(t: number): number {
	const c = clamp(t, 0, 1);
	return c * c * (3 - 2 * c);
}

function makeKeyboardButton(
	el: HTMLElement,
	label: string,
	activate: () => void,
) {
	el.setAttribute('role', 'button');
	el.setAttribute('aria-label', label);
	el.tabIndex = 0;
	el.addEventListener('keydown', (event) => {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			activate();
		}
	});
}

type OrbitLikeControls = {
	enablePan: boolean;
	autoRotate: boolean;
	minDistance: number;
	maxDistance: number;
};

type RuntimeDiamondMaterial = {
	name?: string;
	color?: {
		r: number;
		g: number;
		b: number;
		setRGB: (r: number, g: number, b: number) => void;
	};
	dispersion?: number;
	absorptionFactor?: number;
	refractiveIndex?: number;
	envMapIntensity?: number;
	boostFactors?: {
		x: number;
		y: number;
		z: number;
		set: (x: number, y: number, z: number) => void;
	};
	uniformsNeedUpdate?: boolean;
	setDirty?: () => void;
};

type RuntimeMetalMaterial = {
	name?: string;
	color?: {
		r: number;
		g: number;
		b: number;
		setRGB: (r: number, g: number, b: number) => void;
	};
	metalness?: number;
	roughness?: number;
	envMapIntensity?: number;
	uniformsNeedUpdate?: boolean;
	setDirty?: () => void;
};

const byId = <T extends HTMLElement = HTMLElement>(id: string) =>
	document.getElementById(id) as T;
const query = <T extends HTMLElement = HTMLElement>(selector: string) =>
	document.querySelector(selector) as T;

let onConfiguratorSelect:
	((type: 'Gem' | 'Metal', name: string) => void) | null = null;
let onConfiguratorCloseTray: (() => void) | null = null;

class CustomMaterialConfiguratorPlugin extends MaterialConfiguratorBasePlugin {
	static PluginType = 'MaterialConfiguratorPlugin';

	public buildConfiguratorDom(): boolean {
		const configuratorDiv = byId('configurator');
		if (!configuratorDiv) return false;

		configuratorDiv.innerHTML = '';

		const variationsList =
			this.variations && this.variations.length > 0
				? this.variations
				: [
						{
							uuid: 'Gem',
							title: 'Gem',
							materials: Object.keys(GEM_PRESETS).map((name) => ({
								name,
								uuid: name,
							})),
						},
						{
							uuid: 'Metal',
							title: 'Metal',
							materials: Object.keys(METAL_PRESETS).map(
								(name) => ({
									name,
									uuid: name,
								}),
							),
						},
					];

		for (const variation of variationsList) {
			const container = document.createElement('div');
			container.classList.add('variations');
			container.classList.add(
				variation.title === 'Gem'
					? 'footer-container-diamond-color'
					: 'footer-container-ring-colors',
			);
			container.id = variation.title;
			configuratorDiv.appendChild(container);

			variation.materials.forEach((material) => {
				const onClick = () => {
					container
						.querySelectorAll('.configurator-button')
						.forEach((el) => {
							el.classList.remove('active');
						});
					byId(material.name)?.classList.add('active');
					if (this.variations && this.variations.length > 0) {
						const realVar = this.variations.find(
							(v) => v.title === variation.title,
						);
						if (realVar) {
							this.applyVariation(realVar, material.uuid);
						}
					}
					onConfiguratorSelect?.(
						variation.title === 'Gem' ? 'Gem' : 'Metal',
						material.name,
					);
				};

				const label = displayName(material.name);
				const button = document.createElement('li');
				button.classList.add('configurator-button');
				button.id = material.name;
				button.innerHTML = `
                    <div class="tooltip" aria-hidden="true">${label}</div>
                    <img alt="" loading="lazy" width="40" height="40" src="/assets/images/${material.name}.png">`;
				button.style.position = 'relative';
				button.onclick = onClick;
				makeKeyboardButton(button, label, onClick);
				container.append(button);
			});
			const closeButton = document.createElement('li');
			closeButton.id = variation.uuid + '1';
			closeButton.style.position = 'relative';
			closeButton.innerHTML = `<svg width="24" height="24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20ZM15 9l-6 6M9 9l6 6" stroke="#D4B06A" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
			closeButton.addEventListener('click', () => {
				onConfiguratorCloseTray?.();
			});
			makeKeyboardButton(closeButton, 'Close', () => closeButton.click());
			container.append(closeButton);
		}
		return true;
	}

	protected async _refreshUi(): Promise<boolean> {
		if (!(await super._refreshUi())) return false;
		return this.buildConfiguratorDom();
	}
}

/**
 * Boots the 3D experience and resolves to a teardown function that releases
 * everything it registered (render loop, GSAP ticker, Lenis, ScrollTriggers,
 * window listeners, WebGL context). The home page calls it on unmount so
 * client-side navigation to other routes — and back — works without a reload.
 */
export async function setupViewer(
	heroSlides: HeroRingSlide[],
): Promise<() => void> {
	const canvasView = byId<HTMLCanvasElement>('webgi-canvas');
	const canvasContainer = byId('webgi-canvas-container');
	const buttonExit = query<HTMLButtonElement>('.btn-exit');
	const isMobile = mobileAndTabletCheck();
	const CustomizerInterface = query('.footer-container');
	const diamondColors = query('.footer-diamond-colors');
	const ringColors = query('.footer-ring-colors');
	const bodyDocument = byId('body');
	const htmlDocument = byId('html');
	const stageBackdrop = query('.stage-backdrop');

	const getDiamondTray = () =>
		query<HTMLElement>('.footer-container-diamond-color');
	const getRingTray = () =>
		query<HTMLElement>('.footer-container-ring-colors');

	const viewer = new ViewerApp({
		canvas: canvasView,
		useRgbm: true,
	});

	// Cap internal WebGL render resolution for smooth 60fps on Retina/HiDPI screens
	const rendererAny = viewer.renderer as unknown as {
		displayCanvasScaling?: number;
	};
	rendererAny.displayCanvasScaling = isMobile
		? 1
		: Math.min(window.devicePixelRatio || 1, 1.25);

	const manager = await viewer.addPlugin(AssetManagerPlugin);

	const camera = viewer.scene.activeCamera;
	const position = camera.position;
	const target = camera.target;

	await addBasePlugins(viewer);
	const configuratorPlugin = await viewer.addPlugin(
		CustomMaterialConfiguratorPlugin,
	);

	(viewer as unknown as { confirm: () => boolean }).confirm = () => true;
	window.confirm = () => true;

	const camViews = viewer.getPlugin(CameraViewPlugin)!;

	// Loader progress bar
	const progressBar = query('.progress');
	if (progressBar) {
		progressBar.style.transition = 'transform 0.25s ease-out';
		manager.importer!.addEventListener('onProgress', (ev) => {
			const total = (ev.total as number) || 1;
			const progressRatio = clamp((ev.loaded as number) / total, 0, 1);
			progressBar.style.transform = `scaleX(${progressRatio})`;
		});
	}

	await manager.addFromPath('/assets/scroll-ring-pear.glb');

	// Build swatch trays right after model loads
	configuratorPlugin.buildConfiguratorDom();

	// Fast progressive convergence (6 frames instead of 32)
	const progressive = viewer.getPluginByType('Progressive') as
		{ maxFrameCount?: number } | undefined;
	if (progressive) {
		progressive.maxFrameCount = 6;
	}

	viewer.getPlugin(TonemapPlugin)!.contrast = 1.06;
	viewer.setBackgroundColor(STAGE_KEY_COLOR);
	const ground = viewer.getPlugin(GroundPlugin);
	if (ground) ground.visible = false;

	if (process.env.NODE_ENV !== 'production') {
		(window as unknown as { __hitansh?: unknown }).__hitansh = {
			viewer,
			camViews,
			camera,
		};
	}

	viewer.scene.activeCamera.setCameraOptions({ controlsEnabled: false });

	const matManager = viewer.getManager()?.materials as
		{ findMaterialsByName?: (name: string) => unknown[] } | undefined;
	const gemMaterials = (
		(matManager?.findMaterialsByName?.('Gem') ??
			[]) as RuntimeDiamondMaterial[]
	).filter(Boolean);
	const paveMaterials = (
		(matManager?.findMaterialsByName?.('diamond') ??
			[]) as RuntimeDiamondMaterial[]
	).filter(Boolean);
	const metalMaterials = (
		(matManager?.findMaterialsByName?.('Metal') ??
			[]) as RuntimeMetalMaterial[]
	).filter(Boolean);

	function applyRingPreset(
		gemKey: string,
		metalKey: string,
		paveTintAmount = 0.16,
	) {
		const g = GEM_PRESETS[gemKey] ?? GEM_PRESETS['Diamond White'];
		const m = METAL_PRESETS[metalKey] ?? METAL_PRESETS.Platinum;
		const [gr, gg, gb] = hexToRgb(g.color);
		const [mr, mg, mb] = hexToRgb(m.color);

		for (const gm of gemMaterials) {
			gm.color?.setRGB(gr, gg, gb);
			gm.dispersion = g.dispersion;
			gm.absorptionFactor = g.absorptionFactor;
			gm.refractiveIndex = g.refractiveIndex;
			gm.envMapIntensity = g.envMapIntensity;
			gm.boostFactors?.set(
				g.boostFactors[0],
				g.boostFactors[1],
				g.boostFactors[2],
			);
			gm.uniformsNeedUpdate = true;
			gm.setDirty?.();
		}

		const pr = lerp(1, gr, paveTintAmount);
		const pg = lerp(1, gg, paveTintAmount);
		const pb = lerp(1, gb, paveTintAmount);
		for (const pm of paveMaterials) {
			pm.color?.setRGB(pr, pg, pb);
			pm.uniformsNeedUpdate = true;
		}

		for (const mm of metalMaterials) {
			mm.color?.setRGB(mr, mg, mb);
			mm.metalness = m.metalness;
			mm.roughness = m.roughness;
			mm.uniformsNeedUpdate = true;
			mm.setDirty?.();
		}

		viewer.setDirty();
	}

	function syncCamera() {
		camera.positionTargetUpdated(true);
		viewer.setDirty();
	}

	viewer.renderer.refreshPipeline();

	const loaderFix = query('.loader');
	const lenis = createSmoothScroll();

	let introComplete = false;
	let customizing = false;
	let activeSlideIdx = 0;

	// Detect mobile both by user-agent AND narrow viewport width (works in
	// responsive testing and when rotating tablets/phones).
	const isMobileViewport = () => isMobile || window.innerWidth <= 768;

	// Compute exact camera coordinates for slide 0 at t = 0
	const slide0 = heroSlides[0];
	// Photo slides show pictures of the ring instead of the 3D model, so the
	// canvas stays hidden (and idle) while one is on screen.
	const isPhotoSlide = (i: number) =>
		!!(heroSlides[i]?.photos?.length || heroSlides[i]?.spin?.length);
	let photoSlideShown = isPhotoSlide(0);
	if (photoSlideShown && canvasContainer) canvasContainer.style.opacity = '0';
	const slide0Radius = isMobileViewport()
		? slide0.camera.mobileRadius
		: slide0.camera.radius;
	const initTarget: Vec3Tuple = [
		0,
		isMobileViewport() ? -0.35 : slide0.camera.targetY,
		0.95,
	];
	const initPos: Vec3Tuple = [
		initTarget[0] + Math.sin(slide0.camera.startAzimuth) * slide0Radius,
		slide0.camera.elevationStart,
		initTarget[2] + Math.cos(slide0.camera.startAzimuth) * slide0Radius,
	];

	const currentPos: Vec3Tuple = [...initPos];
	const currentTarget: Vec3Tuple = [...initTarget];

	// Apply Slide 1 (Aurora: White Diamond · Platinum) on load
	applyRingPreset(slide0.gem, slide0.metal);
	if (stageBackdrop) {
		stageBackdrop.style.setProperty(
			'--stage-glow-primary',
			slide0.glowPrimary,
		);
		stageBackdrop.style.setProperty(
			'--stage-glow-secondary',
			slide0.glowSecondary,
		);
	}

	// Cache hero DOM nodes for 60fps scroll updates
	const heroEl = document.querySelector<HTMLElement>('#view1');
	const heroCopies = Array.from(
		document.querySelectorAll<HTMLElement>('[data-hero-copy]'),
	);
	const heroNavItems = Array.from(
		document.querySelectorAll<HTMLElement>('[data-hero-nav]'),
	);
	const heroNavFills = Array.from(
		document.querySelectorAll<HTMLElement>('[data-hero-fill]'),
	);
	const heroCtas = Array.from(
		document.querySelectorAll<HTMLElement>('[data-hero-cta]'),
	);
	const heroCounterCurrent = query<HTMLElement>('.hero-counter__current');
	const heroBgWord = query<HTMLElement>('.hero-backdrop__word-inner');
	const heroHalo = query<HTMLElement>('.hero-backdrop__halo');

	let heroPinSpan = 2600;
	let heroTotalHeight = 3500;

	function measureHero() {
		const vh = window.innerHeight || 900;
		if (heroEl) {
			heroTotalHeight = heroEl.offsetHeight;
			heroPinSpan = Math.max(vh, heroTotalHeight - vh);
		} else {
			heroTotalHeight = vh * 4.6;
			heroPinSpan = vh * 3.6;
		}
	}

	measureHero();
	window.addEventListener('resize', measureHero, { passive: true });
	ScrollTrigger.addEventListener('refresh', measureHero);
	const removeHeroListeners = () => {
		window.removeEventListener('resize', measureHero);
		ScrollTrigger.removeEventListener('refresh', measureHero);
	};

	function setActiveHeroSlideUi(nextIdx: number) {
		if (nextIdx === activeSlideIdx) return;
		activeSlideIdx = nextIdx;
		const slide = heroSlides[nextIdx];

		heroCopies.forEach((el, i) => {
			const active = i === nextIdx;
			el.classList.toggle('is-active', active);
			el.setAttribute('aria-hidden', String(!active));
		});
		heroNavItems.forEach((el, i) => {
			el.classList.toggle('is-active', i === nextIdx);
		});
		heroCtas.forEach((el, i) => {
			el.classList.toggle('is-active', i === nextIdx);
		});
		if (heroCounterCurrent) {
			heroCounterCurrent.textContent = slide.index;
		}
		if (stageBackdrop) {
			stageBackdrop.style.setProperty(
				'--stage-glow-primary',
				slide.glowPrimary,
			);
			stageBackdrop.style.setProperty(
				'--stage-glow-secondary',
				slide.glowSecondary,
			);
		}

		// Apply the new ring design's gemstone & precious metal materials
		applyRingPreset(slide.gem, slide.metal);
	}

	function unlockPageScroll() {
		if (customizing) return;
		bodyDocument.style.overflowY = 'visible';
		htmlDocument.style.overflowY = 'visible';
		lenis.start();
	}

	function finishIntroCamera() {
		introComplete = true;
		currentPos[0] = position.x;
		currentPos[1] = position.y;
		currentPos[2] = position.z;
		currentTarget[0] = target.x;
		currentTarget[1] = target.y;
		currentTarget[2] = target.z;
		measureHero();
	}

	// ---------------------------------  CHOREOGRAPHED INTRO
	const intro = gsap.timeline({ onComplete: finishIntroCamera });
	intro
		.to(
			'.loader__mark',
			{ opacity: 0, y: -18, duration: 0.35, ease: 'power2.in' },
			0,
		)
		.to(
			loaderFix,
			{
				yPercent: -100,
				duration: 0.7,
				ease: 'power3.inOut',
				onComplete: unlockPageScroll,
			},
			0.15,
		)
		.set(loaderFix, { autoAlpha: 0 })
		.fromTo(
			position,
			{
				x: initPos[0] + (isMobile ? 2.4 : 1.8),
				y: initPos[1] - 1.2,
				z: initPos[2] + 2.2,
			},
			{
				x: initPos[0],
				y: initPos[1],
				z: initPos[2],
				duration: 1.5,
				ease: 'power3.out',
				onUpdate: syncCamera,
			},
			0.1,
		)
		.fromTo(
			target,
			{ x: 0, y: -0.2, z: 0.4 },
			{
				x: initTarget[0],
				y: initTarget[1],
				z: initTarget[2],
				duration: 1.5,
				ease: 'power3.out',
				onUpdate: syncCamera,
			},
			0.1,
		)
		.fromTo(
			'.hero-backdrop__word-inner',
			{ opacity: 0, scale: 0.92 },
			{ opacity: 1, scale: 1, duration: 1.1, ease: 'power3.out' },
			0.35,
		)
		.fromTo(
			'.hero-backdrop__halo',
			{ opacity: 0, scale: 0.88 },
			{ opacity: 1, scale: 1, duration: 1.1, ease: 'power3.out' },
			0.45,
		)
		.fromTo(
			'.header',
			{ autoAlpha: 0, yPercent: -100 },
			{
				autoAlpha: 1,
				yPercent: 0,
				duration: 0.7,
				ease: 'power3.out',
				clearProps: 'opacity,visibility,transform',
			},
			0.45,
		)
		.from(
			'[data-hero-reveal]',
			{
				y: 26,
				opacity: 0,
				duration: 0.8,
				ease: 'power3.out',
				stagger: 0.08,
				clearProps: 'opacity,transform',
			},
			0.6,
		);

	// ---------------------------------  4-SLIDE HERO SCROLL CONTROLLER
	let lastTickTime = performance.now();
	let heroActiveRender = true;
	let lastCanvasOpacity = '';

	const heroTick = () => {
		const now = performance.now();
		const dt = clamp((now - lastTickTime) / 1000, 0.001, 0.064);
		lastTickTime = now;

		if (!introComplete || customizing) return;

		const scrollY = window.scrollY;
		const vh = window.innerHeight || 900;

		// Pause WebGL rendering completely once the user has scrolled past the
		// hero banner into the editorial sections below (0% GPU usage).
		const pastHero = scrollY >= heroTotalHeight + 20;
		if (pastHero) {
			if (heroActiveRender) {
				heroActiveRender = false;
				viewer.renderEnabled = false;
				if (canvasContainer) canvasContainer.style.opacity = '0';
				lastCanvasOpacity = '0';
			}
			return;
		} else if (!heroActiveRender) {
			heroActiveRender = true;
			viewer.renderEnabled = true;
			viewer.setDirty();
		}

		// Normalized hero scroll progress [0..1] across the 4 connected slides
		const heroProgress = clamp(scrollY / Math.max(1, heroPinSpan), 0, 1);
		const totalSlides = heroSlides.length;
		const scaled = heroProgress * totalSlides;
		const slideIdx = Math.min(totalSlides - 1, Math.floor(scaled));
		const segT = clamp(scaled - slideIdx, 0, 1);

		// Update active slide UI & 3D ring material when crossing slide boundaries
		if (slideIdx !== activeSlideIdx) {
			setActiveHeroSlideUi(slideIdx);
		}

		// Update 4-segment progress rails
		heroNavFills.forEach((fillEl, i) => {
			const val = i < slideIdx ? 1 : i === slideIdx ? segT : 0;
			fillEl.style.transform = `scaleX(${val.toFixed(3)})`;
		});

		// Subtle architectural backdrop parallax & halo rotation
		if (heroBgWord) {
			const wordScale = 1 + Math.sin(segT * Math.PI) * 0.035;
			heroBgWord.style.transform = `scale(${wordScale.toFixed(4)})`;
		}
		if (heroHalo) {
			heroHalo.style.transform = `rotate(${(heroProgress * 240).toFixed(2)}deg)`;
		}

		// Compute centered 360° orbital camera + smooth entrance/exit depth envelope
		const slide = heroSlides[slideIdx];
		const cam = slide.camera;
		const mobileNow = isMobileViewport();
		const baseRadius = mobileNow ? cam.mobileRadius : cam.radius;

		// Entrance/exit envelope for smooth ring handover between slides
		const enterSpan = 0.16;
		const exitStart = 0.84;
		let depthBoost = 0;
		let slideOpacity = 1;

		if (slideIdx > 0 && segT < enterSpan) {
			const e = smoothstep(segT / enterSpan);
			depthBoost = (1 - e) * 1.9;
			slideOpacity = e;
		} else if (slideIdx < totalSlides - 1 && segT > exitStart) {
			const ex = smoothstep((segT - exitStart) / (1 - exitStart));
			depthBoost = ex * 1.9;
			slideOpacity = 1 - ex;
		}

		// As the hero unpins after slide 4 into #house, smoothly dissolve the canvas
		if (scrollY > heroPinSpan) {
			const unpinT = clamp((scrollY - heroPinSpan) / (vh * 0.65), 0, 1);
			slideOpacity *= 1 - smoothstep(unpinT);
		}

		const photoNow = isPhotoSlide(slideIdx);
		if (photoNow) slideOpacity = 0;
		if (photoNow) {
			if (viewer.renderEnabled) viewer.renderEnabled = false;
		} else if (photoSlideShown) {
			viewer.renderEnabled = true;
			viewer.setDirty();
		}
		photoSlideShown = photoNow;

		const opacityStr = slideOpacity.toFixed(3);
		if (canvasContainer && opacityStr !== lastCanvasOpacity) {
			lastCanvasOpacity = opacityStr;
			canvasContainer.style.opacity = opacityStr;
		}

		const radius = baseRadius + depthBoost;
		const azimuth = cam.startAzimuth + segT * cam.sweepAzimuth;
		const elevation =
			segT < 0.5
				? lerp(
						cam.elevationStart,
						cam.elevationPeak,
						smoothstep(segT * 2),
					)
				: lerp(
						cam.elevationPeak,
						cam.elevationEnd,
						smoothstep((segT - 0.5) * 2),
					);

		const desiredTarget: Vec3Tuple = [
			0,
			mobileNow ? -0.35 : cam.targetY,
			0.95,
		];
		const desiredPos: Vec3Tuple = [
			desiredTarget[0] + Math.sin(azimuth) * radius,
			elevation,
			desiredTarget[2] + Math.cos(azimuth) * radius,
		];

		// If we just crossed a slide handover while opacity is near 0, snap the
		// camera to the new ring's starting angle so it enters cleanly without
		// whipping across the screen.
		const camAlpha = slideOpacity < 0.08 ? 1 : 1 - Math.exp(-11 * dt);

		const delta =
			Math.abs(currentPos[0] - desiredPos[0]) +
			Math.abs(currentPos[1] - desiredPos[1]) +
			Math.abs(currentPos[2] - desiredPos[2]) +
			Math.abs(currentTarget[0] - desiredTarget[0]) +
			Math.abs(currentTarget[1] - desiredTarget[1]) +
			Math.abs(currentTarget[2] - desiredTarget[2]);

		if (delta > 0.0015) {
			currentPos[0] = lerp(currentPos[0], desiredPos[0], camAlpha);
			currentPos[1] = lerp(currentPos[1], desiredPos[1], camAlpha);
			currentPos[2] = lerp(currentPos[2], desiredPos[2], camAlpha);

			currentTarget[0] = lerp(
				currentTarget[0],
				desiredTarget[0],
				camAlpha,
			);
			currentTarget[1] = lerp(
				currentTarget[1],
				desiredTarget[1],
				camAlpha,
			);
			currentTarget[2] = lerp(
				currentTarget[2],
				desiredTarget[2],
				camAlpha,
			);

			position.set(currentPos[0], currentPos[1], currentPos[2]);
			target.set(currentTarget[0], currentTarget[1], currentTarget[2]);
			syncCamera();
		}
	};
	gsap.ticker.add(heroTick);

	// ---------------------------------  ON-DEMAND 3D STUDIO CUSTOMIZER
	let studioGem = slide0.gem as string;
	let studioMetal = slide0.metal as string;

	onConfiguratorSelect = (type, name) => {
		if (type === 'Gem' && GEM_PRESETS[name]) {
			studioGem = name;
		} else if (type === 'Metal' && METAL_PRESETS[name]) {
			studioMetal = name;
		}
		applyRingPreset(studioGem, studioMetal, 0);
	};

	function openStudio(preselectGem?: string, preselectMetal?: string) {
		if (customizing) return;
		customizing = true;
		viewer.renderEnabled = true;
		heroActiveRender = true;

		const currentSlide = heroSlides[activeSlideIdx] ?? slide0;
		studioGem = preselectGem ?? currentSlide.gem;
		studioMetal = preselectMetal ?? currentSlide.metal;

		htmlDocument.classList.add('is-customizing');
		lenis.stop();
		buttonExit.classList.remove('scale-out-center');

		// Bring stage backdrop and 3D canvas into full-screen studio overlay
		if (stageBackdrop) {
			stageBackdrop.style.zIndex = '24';
		}
		canvasContainer.style.transition = 'opacity 0.45s ease-out';
		canvasContainer.style.opacity = '1';
		canvasContainer.style.zIndex = '25';
		canvasContainer.style.pointerEvents = 'all';
		canvasContainer.style.cursor = 'grab';
		canvasView.style.pointerEvents = 'all';
		document.body.style.cursor = 'grab';
		bodyDocument.style.overflowY = 'hidden';
		htmlDocument.style.overflowY = 'hidden';

		buttonExit.style.display = 'inline-flex';
		buttonExit.style.pointerEvents = 'all';
		diamondColors.style.pointerEvents = 'all';
		ringColors.style.pointerEvents = 'all';

		applyRingPreset(studioGem, studioMetal, 0);
		if (preselectGem) {
			document
				.querySelectorAll('#Gem .configurator-button')
				.forEach((el) => el.classList.remove('active'));
			byId(preselectGem)?.classList.add('active');
		}
		if (preselectMetal) {
			document
				.querySelectorAll('#Metal .configurator-button')
				.forEach((el) => el.classList.remove('active'));
			byId(preselectMetal)?.classList.add('active');
		}

		EnableCustomizer();
		setTimeout(() => {
			enableControllers();
		}, 450);
	}

	onRequestOpenStudio(({ gem, metal }) => {
		openStudio(gem, metal);
	});

	async function EnableCustomizer() {
		const view = camViews.getCurrentCameraView(viewer.scene.activeCamera);
		view.position.set(-0.28, 3.335, 9.52);
		view.target.set(0.05, 0.11, 0.84);
		await camViews.animateToView(view, 1100, EasingFunctions.easeInOut);
	}

	function enableControllers() {
		CustomizerInterface.classList.remove('hidden');
		CustomizerInterface.classList.add('visible');
		gsap.fromTo(
			CustomizerInterface,
			{ opacity: 0, y: 60 },
			{
				opacity: 1,
				y: 0,
				duration: 0.7,
				ease: 'power3.out',
				overwrite: true,
				clearProps: 'opacity,transform',
			},
		);
		viewer.scene.activeCamera.setCameraOptions({ controlsEnabled: true });
		cameraControls();
	}

	function cameraControls() {
		const options = viewer.scene.activeCamera.getCameraOptions();
		viewer.scene.activeCamera.setCameraOptions(options);
		const controls = viewer.scene.activeCamera
			.controls as unknown as OrbitLikeControls;
		if (controls) {
			controls.enablePan = false;
			controls.autoRotate = true;
			controls.minDistance = 3;
			controls.maxDistance = 15;
		}
		camera.setCameraOptions({ controlsEnabled: true });
	}

	// ----------------------------   EXIT 3D STUDIO ----------------------
	buttonExit.addEventListener('click', () => {
		if (!customizing) return;
		isCameraSetToFalse();
		buttonExit.classList.add('scale-out-center');

		gsap.to(CustomizerInterface, {
			overwrite: true,
			opacity: 0,
			y: 40,
			duration: 0.35,
			ease: 'power2.in',
		});

		setTimeout(() => {
			gsap.killTweensOf(CustomizerInterface);
			CustomizerInterface.classList.remove('visible');
			CustomizerInterface.classList.add('hidden');
			gsap.set(CustomizerInterface, { clearProps: 'opacity,transform' });
			hideDiamondColorsContainer();
			hideRingColorsContainer();
			viewer.scene.activeCamera.setCameraOptions({
				controlsEnabled: false,
			});

			// Restore normal stacking order & scroll
			customizing = false;
			htmlDocument.classList.remove('is-customizing');
			bodyDocument.style.overflowY = 'visible';
			htmlDocument.style.overflowY = 'visible';
			lenis.start();

			if (stageBackdrop) {
				stageBackdrop.style.zIndex = '0';
			}
			canvasContainer.style.zIndex = '1';
			canvasContainer.style.pointerEvents = 'none';
			canvasContainer.style.cursor = 'default';
			canvasView.style.pointerEvents = 'none';
			document.body.style.cursor = 'default';

			diamondColors.style.pointerEvents = 'none';
			ringColors.style.pointerEvents = 'none';
			buttonExit.style.pointerEvents = 'none';
			buttonExit.style.display = 'none';

			// Restore active hero slide material & camera state
			const currentSlide = heroSlides[activeSlideIdx] ?? slide0;
			applyRingPreset(currentSlide.gem, currentSlide.metal);
			currentPos[0] = position.x;
			currentPos[1] = position.y;
			currentPos[2] = position.z;
			currentTarget[0] = target.x;
			currentTarget[1] = target.y;
			currentTarget[2] = target.z;
			lastCanvasOpacity = '';
		}, 380);
	});

	function isCameraSetToFalse() {
		const options = viewer.scene.activeCamera.getCameraOptions();
		viewer.scene.activeCamera.setCameraOptions(options);
		const controls = viewer.scene.activeCamera
			.controls as unknown as OrbitLikeControls;
		if (controls) {
			controls.autoRotate = false;
			controls.maxDistance = Infinity;
		}
	}

	function isAutoRotateFalse() {
		const options = viewer.scene.activeCamera.getCameraOptions();
		viewer.scene.activeCamera.setCameraOptions(options);
		const controls = viewer.scene.activeCamera
			.controls as unknown as OrbitLikeControls;
		if (controls) controls.autoRotate = false;
	}

	function isAutoRotateTrue() {
		const controls = viewer.scene.activeCamera
			.controls as unknown as OrbitLikeControls;
		if (controls) controls.autoRotate = true;
	}

	ringColors.addEventListener('click', () => {
		hideDiamondColorsContainer();
		isAutoRotateFalse();
		const tray = getRingTray();
		if (tray) {
			tray.classList.add('visible');
			tray.style.visibility = 'visible';
			tray.style.pointerEvents = 'all';
			tray.style.opacity = '1';
		}
		movetoRing();
	});

	diamondColors.addEventListener('click', () => {
		hideRingColorsContainer();
		isAutoRotateFalse();
		const tray = getDiamondTray();
		if (tray) {
			tray.classList.add('visible');
			tray.style.visibility = 'visible';
			tray.style.pointerEvents = 'all';
			tray.style.opacity = '1';
		}
		movetoDiamonds();
	});

	function hideRingColorsContainer() {
		const tray = getRingTray();
		if (!tray) return;
		tray.classList.remove('visible');
		tray.style.opacity = '0';
		tray.style.visibility = 'hidden';
		tray.style.pointerEvents = 'none';
	}

	function hideDiamondColorsContainer() {
		const tray = getDiamondTray();
		if (!tray) return;
		tray.classList.remove('visible');
		tray.style.opacity = '0';
		tray.style.visibility = 'hidden';
		tray.style.pointerEvents = 'none';
	}

	onConfiguratorCloseTray = () => {
		hideDiamondColorsContainer();
		hideRingColorsContainer();
		isAutoRotateTrue();
	};

	async function movetoRing() {
		const moveRing = camViews.getCurrentCameraView(
			viewer.scene.activeCamera,
		);
		moveRing.position.set(
			isMobile ? -5 : -2.25,
			isMobile ? 0.38 : -0.18,
			isMobile ? 8 : 4.56,
		);
		moveRing.target.set(0.2, 0.28, -0.02);
		await camViews.animateToView(moveRing, 1100, EasingFunctions.easeInOut);
	}

	async function movetoDiamonds() {
		const moveDiamonds = camViews.getCurrentCameraView(
			viewer.scene.activeCamera,
		);
		moveDiamonds.position.set(
			isMobile ? 1.8 : 1.59,
			isMobile ? 1.2 : 0.65,
			isMobile ? 8.4 : 5.05,
		);
		moveDiamonds.target.set(-0.1, 0.02, 0.4);
		await camViews.animateToView(
			moveDiamonds,
			1100,
			EasingFunctions.easeInOut,
		);
	}

	// ---------------------------------  TEARDOWN (leaving the home page)
	return () => {
		gsap.ticker.remove(heroTick);
		removeHeroListeners();
		destroySmoothScroll();
		ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
		viewer.renderEnabled = false;
		viewer.dispose();
		// Hand scrolling back to the next page's own CSS.
		htmlDocument.style.removeProperty('overflow-y');
		bodyDocument.style.removeProperty('overflow-y');
	};
}
