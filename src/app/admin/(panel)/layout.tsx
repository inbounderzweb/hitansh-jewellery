import { requireAdmin } from '@/lib/auth/session';
import { collections } from '@/lib/db/mongo';
import Sidebar from '@/components/admin/Sidebar';

/** Every page in this group requires a signed-in administrator. */
export default async function PanelLayout({
	children,
}: Readonly<{ children: React.ReactNode }>) {
	const session = await requireAdmin();
	const { enquiries } = await collections();
	const newEnquiries = await enquiries.countDocuments({ status: 'new' });

	return (
		<div className="a-shell">
			<Sidebar
				userName={session.name || session.email}
				newEnquiries={newEnquiries}
			/>
			<main id="main-content" className="a-main">
				{children}
			</main>
		</div>
	);
}
