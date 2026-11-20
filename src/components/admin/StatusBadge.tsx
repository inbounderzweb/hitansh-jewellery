import type { EnquiryStatus } from '@/lib/db/types';

export const STATUS_LABELS: Record<EnquiryStatus, string> = {
	new: 'New',
	contacted: 'Contacted',
	completed: 'Completed',
};

export default function StatusBadge({ status }: { status: EnquiryStatus }) {
	return (
		<span className={`a-status a-status--${status}`}>
			{STATUS_LABELS[status]}
		</span>
	);
}
