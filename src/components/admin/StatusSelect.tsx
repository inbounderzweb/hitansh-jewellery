'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { updateEnquiry } from '@/app/admin/actions/enquiries';
import { ENQUIRY_STATUSES, type EnquiryStatus } from '@/lib/db/types';
import { STATUS_LABELS } from './StatusBadge';

export default function StatusSelect({
	id,
	status,
	label,
}: {
	id: string;
	status: EnquiryStatus;
	label: string;
}) {
	const router = useRouter();
	const [value, setValue] = useState(status);
	const [pending, start] = useTransition();
	const [error, setError] = useState('');

	return (
		<span className="a-statusselect">
			<select
				className={`a-status a-status--${value}`}
				aria-label={label}
				value={value}
				disabled={pending}
				onChange={(e) => {
					const next = e.target.value as EnquiryStatus;
					const previous = value;
					setValue(next);
					start(async () => {
						const res = await updateEnquiry(id, { status: next });
						if (!res.ok) {
							setValue(previous);
							setError(res.message ?? 'Not saved');
						} else {
							setError('');
							router.refresh();
						}
					});
				}}
			>
				{ENQUIRY_STATUSES.map((s) => (
					<option key={s} value={s}>
						{STATUS_LABELS[s]}
					</option>
				))}
			</select>
			{error && (
				<span className="a-error" role="alert">
					{error}
				</span>
			)}
		</span>
	);
}
