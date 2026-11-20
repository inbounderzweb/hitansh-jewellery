'use client';

/** Accessible on/off switch (a checkbox with role="switch"). */
export default function Toggle({
	label,
	checked,
	disabled,
	onChange,
	showLabel = false,
}: {
	label: string;
	checked: boolean;
	disabled?: boolean;
	onChange: (value: boolean) => void;
	showLabel?: boolean;
}) {
	return (
		<label className="a-toggle">
			<input
				type="checkbox"
				role="switch"
				checked={checked}
				disabled={disabled}
				onChange={(e) => onChange(e.target.checked)}
			/>
			<span className="a-toggle__track" aria-hidden />
			<span className={showLabel ? 'a-toggle__label' : 'a-sr'}>
				{label}
			</span>
		</label>
	);
}
