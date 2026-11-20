import Image from 'next/image';
import Link from 'next/link';
import { brand, contact, navigation, social } from '@/content/site';

/**
 * `basePath` prefixes the on-page section links, so the footer can be used
 * on pages other than home (pass `basePath="/"`).
 */
export default function SiteFooter({ basePath = '' }: { basePath?: string }) {
	const year = new Date().getFullYear();
	return (
		<footer id="contact" className="site-footer">
			<div className="container">
				<div className="site-footer__top">
					<Link
						href={`${basePath}#view1`}
						className="site-footer__logo"
						aria-label="Back to top"
					>
						<Image
							src="/brand/hitansh-logo.png"
							alt={brand.fullName}
							width={1204}
							height={1006}
							sizes="200px"
						/>
					</Link>
					<p className="site-footer__statement" data-split>
						Treasured today, <em>treasured</em> for generations.
					</p>
				</div>

				<div className="site-footer__columns">
					<nav aria-label="Footer">
						<h3 className="site-footer__heading">Explore</h3>
						<ul>
							{navigation.map((item) => (
								<li key={item.href}>
									<Link href={`${basePath}${item.href}`}>
										{item.label}
									</Link>
								</li>
							))}
						</ul>
					</nav>
					<div>
						<h3 className="site-footer__heading">Client care</h3>
						<ul>
							<li>
								<Link href={`${basePath}#appointment`}>
									Book a consultation
								</Link>
							</li>
							<li>
								<Link href={`${basePath}#view3`}>
									Design in 3D
								</Link>
							</li>
							<li>
								<Link href={`${basePath}#showcase`}>
									The Pear Halo Edit
								</Link>
							</li>
						</ul>
					</div>
					<div>
						<h3 className="site-footer__heading">Contact</h3>
						<ul>
							<li>
								<a href={`mailto:${contact.email}`}>
									{contact.email}
								</a>
							</li>
							{contact.phone && (
								<li>
									<a href={`tel:${contact.phone}`}>
										{contact.phone}
									</a>
								</li>
							)}
							{contact.address && <li>{contact.address}</li>}
						</ul>
					</div>
					<div>
						<h3 className="site-footer__heading">Follow</h3>
						<ul>
							<li>
								<a
									href={social.instagramUrl}
									target="_blank"
									rel="noreferrer"
								>
									Instagram {social.instagramHandle}
								</a>
							</li>
						</ul>
					</div>
				</div>

				<div className="site-footer__bottom">
					<p>
						© {year} {brand.fullName}. All rights reserved.
					</p>
					<Link className="link" href={basePath ? '#' : '#view1'}>
						Back to top
						<svg viewBox="0 0 24 24" fill="none" aria-hidden>
							<path
								d="M12 19V5M6 11l6-6 6 6"
								stroke="currentColor"
								strokeWidth="1.3"
								strokeLinecap="round"
							/>
						</svg>
					</Link>
				</div>
			</div>
		</footer>
	);
}
