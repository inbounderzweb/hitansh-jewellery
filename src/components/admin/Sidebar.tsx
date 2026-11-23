'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { logout } from '@/app/admin/actions/auth';
import Icon, { type IconName } from './Icon';

const NAV: { href: string; label: string; icon: IconName }[] = [
	{ href: '/admin', label: 'Dashboard', icon: 'grid' },
	{ href: '/admin/products', label: 'Products', icon: 'ring' },
	{ href: '/admin/collections', label: 'Collections', icon: 'layers' },
	{ href: '/admin/hero', label: '3D banner', icon: 'hero' },
	{ href: '/admin/making', label: 'Making section', icon: 'stages' },
	{ href: '/admin/banner', label: 'Ring showcase', icon: 'sparkle' },
	{ href: '/admin/media', label: 'Media library', icon: 'image' },
	{ href: '/admin/enquiries', label: 'Enquiries', icon: 'mail' },
];

export default function Sidebar({
	userName,
	newEnquiries,
}: {
	userName: string;
	newEnquiries: number;
}) {
	const pathname = usePathname();
	const [open, setOpen] = useState(false);
	const isActive = (href: string) =>
		href === '/admin' ? pathname === href : pathname.startsWith(href);

	return (
		<>
			<div className="a-topbar">
				<Link href="/admin" className="a-brand">
					Hitansh <span>Admin</span>
				</Link>
				<button
					type="button"
					className="a-iconbtn"
					aria-expanded={open}
					aria-controls="a-sidebar"
					onClick={() => setOpen((o) => !o)}
				>
					<Icon name={open ? 'close' : 'menu'} />
					<span className="a-sr">Menu</span>
				</button>
			</div>

			<aside
				id="a-sidebar"
				className={`a-sidebar${open ? ' is-open' : ''}`}
			>
				<Link
					href="/admin"
					className="a-brand a-sidebar__brand"
					onClick={() => setOpen(false)}
				>
					Hitansh <span>Admin</span>
				</Link>
				<nav aria-label="Admin">
					<ul className="a-nav">
						{NAV.map((item) => (
							<li key={item.href}>
								<Link
									href={item.href}
									className="a-nav__link"
									aria-current={
										isActive(item.href) ? 'page' : undefined
									}
									onClick={() => setOpen(false)}
								>
									<Icon name={item.icon} />
									{item.label}
									{item.href === '/admin/enquiries' &&
										newEnquiries > 0 && (
											<span
												className="a-nav__badge"
												aria-label={`${newEnquiries} new`}
											>
												{newEnquiries}
											</span>
										)}
								</Link>
							</li>
						))}
					</ul>
				</nav>
				<div className="a-sidebar__foot">
					<a
						href="/"
						target="_blank"
						rel="noreferrer"
						className="a-nav__link"
					>
						<Icon name="external" />
						View website
					</a>
					<p className="a-sidebar__user">{userName}</p>
					<form action={logout}>
						<button type="submit" className="a-nav__link">
							<Icon name="logout" />
							Sign out
						</button>
					</form>
				</div>
			</aside>
		</>
	);
}
