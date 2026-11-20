'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { deleteEnquiry, updateEnquiry } from '@/app/admin/actions/enquiries';
import { TextArea } from './Field';
import Icon from './Icon';

/** Internal notes and deletion for one enquiry. */
export default function EnquiryActions({
	id,
	notes,
}: {
	id: string;
	notes: string;
}) {
	const router = useRouter();
	const [value, setValue] = useState(notes);
	const [status, setStatus] = useState('');
	const [pending, start] = useTransition();

	return (
		<section className="a-card" aria-labelledby="sec-notes">
			<h2 id="sec-notes" className="a-card__title">
				Internal notes
			</h2>
			<TextArea
				label="Notes"
				name="notes"
				value={value}
				maxLength={4000}
				rows={4}
				hint="Only visible to administrators."
				onChange={(v) => {
					setValue(v);
					setStatus('');
				}}
			/>
			<div className="a-row">
				<button
					type="button"
					className="a-btn a-btn--gold"
					disabled={pending || value === notes}
					onClick={() =>
						start(async () => {
							const res = await updateEnquiry(id, {
								notes: value,
							});
							setStatus(
								res.ok
									? 'Notes saved.'
									: (res.message ?? 'Not saved.'),
							);
							if (res.ok) router.refresh();
						})
					}
				>
					Save notes
				</button>
				<span className="a-muted" role="status">
					{status}
				</span>
				<button
					type="button"
					className="a-btn a-btn--danger a-row__end"
					disabled={pending}
					onClick={() => {
						if (!confirm('Delete this enquiry permanently?'))
							return;
						start(async () => {
							const res = await deleteEnquiry(id);
							if (res.ok) router.push('/admin/enquiries');
							else setStatus(res.message ?? 'Not deleted.');
						});
					}}
				>
					<Icon name="trash" /> Delete
				</button>
			</div>
		</section>
	);
}
