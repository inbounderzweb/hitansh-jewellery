import type { Metadata } from 'next';
import '../../styles/admin.css';

export const metadata: Metadata = {
	title: { default: 'Admin', template: '%s · Admin' },
	robots: { index: false, follow: false },
};

/** Admin area: always rendered per request, never indexed. */
export default function AdminRootLayout({
	children,
}: Readonly<{ children: React.ReactNode }>) {
	return <div className="admin">{children}</div>;
}
