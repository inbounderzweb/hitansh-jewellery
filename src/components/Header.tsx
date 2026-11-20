'use client';

import Image from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';
import { navigation, social } from '@/content/site';
import { scrollToTarget } from '@/lib/scroll';
import { getLenis } from '@/lib/viewer/smoothScroll';

/**
 * Fixed site header.
 * - Centred brand lockup, split navigation on desktop, full-screen menu on
 *   tablet/mobile.
 * - Hides while scrolling down, returns when scrolling up, and condenses to the
 *   monogram once past the hero.
 * - Contains the EXIT button of the 3D customizer (`.btn-exit` / #ExitButton),
 *   which is shown and hidden by `setupViewer.ts`.
 */
export default function Header() {
	const barRef = useRef<HTMLDivElement>(null);
	const [menuOpen, setMenuOpen] = useState(false);
	const lenisWasRunning = useRef(false);

	// Scroll-direction aware header
	useEffect(() => {
		const bar = barRef.current;
		if (!bar) return;
		let lastY = window.scrollY;
		let ticking = false;
		const update = () => {
			ticking = false;
			const y = window.scrollY;
			const delta = y - lastY;
			if (Math.abs(delta) > 4) {
				bar.classList.toggle(
					'is-hidden',
					delta > 0 && y > window.innerHeight * 0.6,
				);
				lastY = y;
			}
			const heroHeight =
				document.getElementById('view1')?.offsetHeight ??
				window.innerHeight * 4;
			bar.classList.toggle('is-compact', y > window.innerHeight * 0.5);
			bar.classList.toggle(
				'is-solid',
				y > heroHeight - window.innerHeight * 0.5,
			);
		};
		const onScroll = () => {
			if (!ticking) {
				ticking = true;
				requestAnimationFrame(update);
			}
		};
		window.addEventListener('scroll', onScroll, { passive: true });
		update();
		return () => window.removeEventListener('scroll', onScroll);
	}, []);

	const closeMenu = useCallback(() => {
		setMenuOpen(false);
		if (lenisWasRunning.current) getLenis()?.start();
		lenisWasRunning.current = false;
	}, []);

	const openMenu = useCallback(() => {
		const lenis = getLenis();
		lenisWasRunning.current = !!lenis && !lenis.isStopped;
		lenis?.stop();
		setMenuOpen(true);
	}, []);

	useEffect(() => {
		if (!menuOpen) return;
		const onKey = (event: KeyboardEvent) => {
			if (event.key === 'Escape') closeMenu();
		};
		window.addEventListener('keydown', onKey);
		document
			.querySelector<HTMLElement>('.menu__links a')
			?.focus({ preventScroll: true });
		return () => window.removeEventListener('keydown', onKey);
	}, [menuOpen, closeMenu]);

	const onNavigate = (
		event: React.MouseEvent<HTMLAnchorElement>,
		href: string,
	) => {
		event.preventDefault();
		if (menuOpen) closeMenu();
		// Let Lenis restart before scrolling when coming from the menu.
		window.setTimeout(() => scrollToTarget(href), menuOpen ? 60 : 0);
	};

	const left = navigation.slice(0, 3);
	const right = navigation.slice(3);

	return (
		<>
			<header className="header">
				<div className="header__bar" ref={barRef}>
					<nav className="header__nav" aria-label="Primary">
						<button
							type="button"
							className="menu-toggle"
							aria-expanded={menuOpen}
							aria-controls="site-menu"
							onClick={menuOpen ? closeMenu : openMenu}
						>
							<span className="menu-toggle__lines" aria-hidden />
							<span className="menu-toggle__label">
								{menuOpen ? 'Close' : 'Menu'}
							</span>
						</button>
						<ul className="header__links">
							{left.map((item) => (
								<li key={item.href}>
									<a
										href={item.href}
										onClick={(e) =>
											onNavigate(e, item.href)
										}
									>
										{item.label}
									</a>
								</li>
							))}
						</ul>
					</nav>

					<a
						className="header__brand"
						href="#view1"
						aria-label="Hitansh Fine Jewellery — back to top"
						onClick={(e) => onNavigate(e, '#view1')}
					>
						<Image
							className="header__monogram"
							src="/brand/hitansh-monogram.png"
							alt=""
							width={444}
							height={510}
							priority
						/>
						<Image
							className="header__wordmark"
							src="/brand/hitansh-wordmark.png"
							alt="Hitansh"
							width={1204}
							height={206}
							priority
						/>
					</a>

					<div className="header__actions">
						<ul className="header__links">
							{right.map((item) => (
								<li key={item.href}>
									<a
										href={item.href}
										onClick={(e) =>
											onNavigate(e, item.href)
										}
									>
										{item.label}
									</a>
								</li>
							))}
						</ul>
						<a
							className="btn btn--outline header__cta"
							href="#appointment"
							onClick={(e) => onNavigate(e, '#appointment')}
						>
							Book a consultation
						</a>
						<button
							id="ExitButton"
							type="button"
							className="btn-exit btn-exit-customize scale-up-center"
							aria-label="Exit the 3D studio"
						>
							<svg viewBox="0 0 24 24" aria-hidden>
								<path d="M6 6l12 12M18 6L6 18" />
							</svg>
							<span>Exit studio</span>
						</button>
					</div>
				</div>
			</header>

			<div
				id="site-menu"
				className={`menu${menuOpen ? ' is-open' : ''}`}
				role="dialog"
				aria-modal="true"
				aria-label="Site menu"
				inert={!menuOpen}
			>
				<div className="menu__inner">
					<p className="eyebrow">Hitansh Fine Jewellery</p>
					<ul className="menu__links">
						{navigation.map((item, i) => (
							<li
								key={item.href}
								style={{ '--i': i } as React.CSSProperties}
							>
								<a
									href={item.href}
									onClick={(e) => onNavigate(e, item.href)}
								>
									<span className="menu__index">
										0{i + 1}
									</span>
									{item.label}
								</a>
							</li>
						))}
					</ul>
					<div className="menu__footer">
						<a
							className="btn btn--gold"
							href="#appointment"
							onClick={(e) => onNavigate(e, '#appointment')}
						>
							Book a consultation
						</a>
						<a
							className="link"
							href={social.instagramUrl}
							target="_blank"
							rel="noreferrer"
						>
							Instagram {social.instagramHandle}
						</a>
					</div>
				</div>
			</div>
		</>
	);
}
