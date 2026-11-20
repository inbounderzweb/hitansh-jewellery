'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { contact } from '@/content/site';
import {
	ENQUIRY_LIMITS,
	validateEnquiry,
	type EnquiryErrors,
	type EnquiryInput,
} from '@/lib/enquiry';

type Props = {
	/** Product the enquiry is about; omit for a general consultation request. */
	product?: { slug: string; name: string; reference?: string };
	className?: string;
	children?: React.ReactNode;
};

type Status = 'idle' | 'sending' | 'sent' | 'mail' | 'error';

const EMPTY: EnquiryInput = { name: '', email: '', phone: '', message: '' };

const FIELDS: {
	key: keyof EnquiryInput;
	label: string;
	type: string;
	autoComplete: string;
	inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode'];
	optional?: boolean;
}[] = [
	{ key: 'name', label: 'Full name', type: 'text', autoComplete: 'name' },
	{
		key: 'email',
		label: 'Email address',
		type: 'email',
		autoComplete: 'email',
		inputMode: 'email',
	},
	{
		key: 'phone',
		label: 'Phone number',
		type: 'tel',
		autoComplete: 'tel',
		inputMode: 'tel',
	},
	{
		key: 'message',
		label: 'Message',
		type: 'textarea',
		autoComplete: 'off',
		optional: true,
	},
];

function mailtoHref(values: EnquiryInput, product: Props['product']) {
	const about = product
		? `${product.name}${product.reference ? ` (Ref. ${product.reference})` : ''}`
		: 'a private consultation';
	const lines = [
		`Enquiry about ${about}`,
		'',
		`Name: ${values.name}`,
		`Email: ${values.email}`,
		`Phone: ${values.phone}`,
		...(values.message ? ['', values.message] : []),
	];
	const subject = product
		? `Enquiry: ${about}`
		: 'Private consultation request';
	return `mailto:${contact.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join('\n'))}`;
}

/**
 * "Enquire now" button with its lead-capture dialog. Submits to
 * `/api/enquiry`; if no delivery endpoint is configured there, it falls back
 * to the site's existing channel: an email to `contact.email`, prefilled.
 */
export default function EnquiryButton({
	product,
	className = 'btn btn--gold',
	children = 'Enquire now',
}: Props) {
	const dialogRef = useRef<HTMLDialogElement>(null);
	const formRef = useRef<HTMLFormElement>(null);
	const [values, setValues] = useState<EnquiryInput>(EMPTY);
	const [errors, setErrors] = useState<EnquiryErrors>({});
	const [touched, setTouched] = useState<
		Partial<Record<keyof EnquiryInput, boolean>>
	>({});
	const [status, setStatus] = useState<Status>('idle');
	const id = useId();

	const open = () => {
		if (status === 'sent' || status === 'mail') {
			setValues(EMPTY);
			setTouched({});
			setErrors({});
			setStatus('idle');
		}
		dialogRef.current?.showModal();
	};
	const close = () => dialogRef.current?.close();

	// Lock page scroll while the dialog is open.
	useEffect(() => {
		const dialog = dialogRef.current;
		if (!dialog) return;
		const onClose = () =>
			document.documentElement.classList.remove('has-dialog');
		const observer = new MutationObserver(() => {
			document.documentElement.classList.toggle(
				'has-dialog',
				dialog.open,
			);
		});
		observer.observe(dialog, {
			attributes: true,
			attributeFilter: ['open'],
		});
		dialog.addEventListener('close', onClose);
		return () => {
			observer.disconnect();
			dialog.removeEventListener('close', onClose);
			onClose();
		};
	}, []);

	const update = (key: keyof EnquiryInput, value: string) => {
		const next = { ...values, [key]: value };
		setValues(next);
		if (touched[key]) setErrors(validateEnquiry(next));
	};

	const blur = (key: keyof EnquiryInput) => {
		setTouched((t) => ({ ...t, [key]: true }));
		setErrors(validateEnquiry(values));
	};

	const submit = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		const found = validateEnquiry(values);
		setErrors(found);
		setTouched({ name: true, email: true, phone: true, message: true });
		const firstInvalid = FIELDS.find((f) => found[f.key]);
		if (firstInvalid) {
			formRef.current
				?.querySelector<HTMLElement>(`[name="${firstInvalid.key}"]`)
				?.focus();
			return;
		}

		setStatus('sending');
		const company =
			formRef.current?.querySelector<HTMLInputElement>('[name="company"]')
				?.value ?? '';
		try {
			const res = await fetch('/api/enquiry', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					...values,
					company,
					product: product?.slug,
				}),
			});
			if (res.ok) {
				setStatus('sent');
				return;
			}
			const data = (await res.json().catch(() => ({}))) as {
				reason?: string;
				errors?: EnquiryErrors;
			};
			if (res.status === 422 && data.errors) {
				setErrors(data.errors);
				setStatus('idle');
				return;
			}
			if (data.reason === 'not-configured') {
				window.location.href = mailtoHref(values, product);
				setStatus('mail');
				return;
			}
			setStatus('error');
		} catch {
			setStatus('error');
		}
	};

	const showError = (key: keyof EnquiryInput) => touched[key] && errors[key];
	const done = status === 'sent' || status === 'mail';

	return (
		<>
			<button type="button" className={className} onClick={open}>
				{children}
			</button>

			<dialog
				ref={dialogRef}
				className="enquiry"
				aria-labelledby={`${id}-title`}
				onClick={(e) => {
					// Click on the backdrop closes the dialog.
					if (e.target === e.currentTarget) close();
				}}
			>
				<div className="enquiry__panel">
					<button
						type="button"
						className="enquiry__close"
						onClick={close}
						aria-label="Close"
					>
						<svg viewBox="0 0 24 24" aria-hidden>
							<path d="M6 6l12 12M18 6L6 18" />
						</svg>
					</button>

					{done ? (
						<div className="enquiry__done" role="status">
							<p className="enquiry__eyebrow">
								{status === 'sent'
									? 'Enquiry received'
									: 'Almost there'}
							</p>
							<h2 id={`${id}-title`} className="enquiry__title">
								Thank you, {values.name.split(' ')[0]}
							</h2>
							{status === 'sent' ? (
								<p>
									Your enquiry
									{product
										? ` about ${product.name}`
										: ''}{' '}
									has been sent. A member of our team will
									contact you shortly at {values.email}.
								</p>
							) : (
								<p>
									Your email app should now open with your
									enquiry ready to send. If it didn’t, please
									email us at{' '}
									<a href={mailtoHref(values, product)}>
										{contact.email}
									</a>
									.
								</p>
							)}
							<button
								type="button"
								className="btn btn--outline"
								onClick={close}
							>
								Continue browsing
							</button>
						</div>
					) : (
						<form ref={formRef} noValidate onSubmit={submit}>
							<p className="enquiry__eyebrow">
								{product
									? 'Product enquiry'
									: 'Private consultation'}
							</p>
							<h2 id={`${id}-title`} className="enquiry__title">
								{product ? product.name : 'Book a consultation'}
							</h2>
							{product?.reference && (
								<p className="enquiry__ref">
									Ref. {product.reference}
								</p>
							)}
							<p className="enquiry__intro">
								Share your details and our team will be in touch
								to arrange a viewing or answer your questions.
							</p>

							<div className="enquiry__fields">
								{FIELDS.map((f) => {
									const err = showError(f.key);
									const common = {
										id: `${id}-${f.key}`,
										name: f.key,
										value: values[f.key],
										autoComplete: f.autoComplete,
										required: !f.optional,
										maxLength: ENQUIRY_LIMITS[f.key],
										'aria-invalid': err ? true : undefined,
										'aria-describedby': err
											? `${id}-${f.key}-error`
											: undefined,
										onBlur: () => blur(f.key),
									};
									return (
										<div
											key={f.key}
											className={`field${f.type === 'textarea' ? ' field--wide' : ''}`}
										>
											<label htmlFor={common.id}>
												{f.label}
												{f.optional && (
													<span className="field__opt">
														Optional
													</span>
												)}
											</label>
											{f.type === 'textarea' ? (
												<textarea
													{...common}
													rows={4}
													onChange={(e) =>
														update(
															f.key,
															e.target.value,
														)
													}
												/>
											) : (
												<input
													{...common}
													type={f.type}
													inputMode={f.inputMode}
													onChange={(e) =>
														update(
															f.key,
															e.target.value,
														)
													}
												/>
											)}
											{err && (
												<p
													className="field__error"
													id={`${id}-${f.key}-error`}
												>
													{err}
												</p>
											)}
										</div>
									);
								})}
								{/* Honeypot — hidden from people and assistive tech. */}
								<div className="enquiry__hp" aria-hidden>
									<label>
										Company
										<input
											name="company"
											tabIndex={-1}
											autoComplete="off"
										/>
									</label>
								</div>
							</div>

							{status === 'error' && (
								<p className="enquiry__alert" role="alert">
									We couldn’t send your enquiry just now.
									Please try again, or email us at{' '}
									<a href={mailtoHref(values, product)}>
										{contact.email}
									</a>
									.
								</p>
							)}

							<button
								type="submit"
								className="btn btn--gold enquiry__submit"
								disabled={status === 'sending'}
							>
								{status === 'sending'
									? 'Sending…'
									: 'Submit enquiry'}
							</button>
							<p className="enquiry__note">
								We use your details only to respond to this
								enquiry.
							</p>
						</form>
					)}
				</div>
			</dialog>
		</>
	);
}
