'use client';

import { useId } from 'react';

type Common = {
	label: string;
	name: string;
	value: string;
	onChange: (value: string) => void;
	error?: string;
	hint?: string;
	maxLength?: number;
	required?: boolean;
};

function Describe({
	id,
	hint,
	error,
}: {
	id: string;
	hint?: string;
	error?: string;
}) {
	return (
		<>
			{hint && (
				<p className="a-hint" id={`${id}-hint`}>
					{hint}
				</p>
			)}
			{error && (
				<p className="a-error" id={`${id}-err`} role="alert">
					{error}
				</p>
			)}
		</>
	);
}

const describedBy = (id: string, hint?: string, error?: string) =>
	[hint && `${id}-hint`, error && `${id}-err`].filter(Boolean).join(' ') ||
	undefined;

export function Field({
	label,
	name,
	value,
	onChange,
	error,
	hint,
	maxLength,
	required,
	prefix,
	type = 'text',
}: Common & { prefix?: string; type?: string }) {
	const id = useId();
	return (
		<div className="a-field" data-field={name}>
			<label htmlFor={id}>
				{label}
				{!required && <span className="a-opt">Optional</span>}
			</label>
			<div className={prefix ? 'a-prefixed' : undefined}>
				{prefix && <span aria-hidden>{prefix}</span>}
				<input
					id={id}
					name={name}
					type={type}
					value={value}
					maxLength={maxLength}
					required={required}
					aria-invalid={error ? true : undefined}
					aria-describedby={describedBy(id, hint, error)}
					onChange={(e) => onChange(e.target.value)}
				/>
			</div>
			<Describe id={id} hint={hint} error={error} />
		</div>
	);
}

export function TextArea({
	label,
	name,
	value,
	onChange,
	error,
	hint,
	maxLength,
	required,
	rows = 4,
}: Common & { rows?: number }) {
	const id = useId();
	return (
		<div className="a-field" data-field={name}>
			<label htmlFor={id}>
				{label}
				{!required && <span className="a-opt">Optional</span>}
			</label>
			<textarea
				id={id}
				name={name}
				rows={rows}
				value={value}
				maxLength={maxLength}
				required={required}
				aria-invalid={error ? true : undefined}
				aria-describedby={describedBy(id, hint, error)}
				onChange={(e) => onChange(e.target.value)}
			/>
			{maxLength && (
				<p className="a-count" aria-hidden>
					{value.length} / {maxLength}
				</p>
			)}
			<Describe id={id} hint={hint} error={error} />
		</div>
	);
}
