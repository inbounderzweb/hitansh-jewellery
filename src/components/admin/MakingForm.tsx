'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, useTransition } from 'react';
import { saveMaking } from '@/app/admin/actions/making';
import { discardUploads } from '@/app/admin/actions/catalogue';
import CatalogueImage from '@/components/catalogue/CatalogueImage';
import type { ImageAsset } from '@/lib/catalogue';
import type { MakingFormValues } from '@/lib/admin/data';
import {
	parseMaking,
	validateMaking,
	type FieldErrors,
} from '@/lib/admin/validation';
import { SPIN_FRAMES } from '@/lib/hero';
import { MAKING_LIMITS, makingEyebrow, splitAccent } from '@/lib/making';
import { Field, TextArea } from './Field';
import Icon from './Icon';
import SpinMaker from './SpinMaker';
import Toggle from './Toggle';

export default function MakingForm({
	initial,
	banner,
}: {
	initial: MakingFormValues;
	banner: { name: string; frames: ImageAsset[] } | null;
}) {
	const router = useRouter();
	const [values, setValues] = useState(initial);
	const [errors, setErrors] = useState<FieldErrors>({});
	const [message, setMessage] = useState('');
	const [saved, setSaved] = useState(false);
	const [pending, start] = useTransition();
	const dirty = useRef(false);
	const [unsaved] = useState(() => new Set<string>());

	useEffect(() => {
		const warn = (e: BeforeUnloadEvent) => {
			if (dirty.current) e.preventDefault();
		};
		window.addEventListener('beforeunload', warn);
		return () => window.removeEventListener('beforeunload', warn);
	}, []);

	const set = <K extends keyof MakingFormValues>(
		key: K,
		value: MakingFormValues[K],
		errorKey: string = key,
	) => {
		dirty.current = true;
		setSaved(false);
		setErrors((e) => {
			if (!(errorKey in e)) return e;
			const rest = { ...e };
			delete rest[errorKey];
			return rest;
		});
		setValues((v) => ({ ...v, [key]: value }));
	};

	const submit = (event: React.FormEvent) => {
		event.preventDefault();
		const found = validateMaking(parseMaking(values));
		setErrors(found);
		if (Object.keys(found).length)
			return setMessage('Please correct the highlighted fields.');
		start(async () => {
			setMessage('');
			const res = await saveMaking(values);
			if (!res.ok) {
				setErrors(res.errors ?? {});
				setMessage(res.message ?? 'The section could not be saved.');
				return;
			}
			dirty.current = false;
			unsaved.clear();
			setSaved(true);
			router.refresh();
		});
	};

	const reset = () => {
		if (dirty.current && !confirm('Discard your unsaved changes?')) return;
		if (unsaved.size) void discardUploads([...unsaved]);
		unsaved.clear();
		dirty.current = false;
		setValues(initial);
		setErrors({});
		setMessage('');
	};

	const frames =
		values.source === 'own' ? values.spin : (banner?.frames ?? []);
	const preview = frames[0];

	return (
		<form className="a-form a-editor" onSubmit={submit} noValidate>
			<div className="a-editor__main">
				<section
					className="a-card"
					aria-labelledby="sec-ring"
					data-field="spin"
				>
					<h2 id="sec-ring" className="a-card__title">
						Ring
					</h2>
					<div
						className="a-segment"
						role="radiogroup"
						aria-label="Which ring the section shows"
					>
						{(
							[
								['banner', 'Same ring as the 3D banner'],
								['own', 'Its own 360° video'],
							] as const
						).map(([source, label]) => (
							<label
								key={source}
								className={
									values.source === source ? 'is-on' : ''
								}
							>
								<input
									type="radio"
									name="source"
									value={source}
									checked={values.source === source}
									onChange={() => set('source', source)}
								/>
								{label}
							</label>
						))}
					</div>
					{values.source === 'banner' ? (
						<p className="a-hint a-hint--top">
							{banner ? (
								<>
									Shows <strong>{banner.name}</strong> — the
									first visible 360° slide in Admin → 3D
									banner. Change that slide (or its order) and
									this section follows.
								</>
							) : (
								<>
									No 3D banner slide has a 360° video yet, so
									the section is hidden. Add one there, or
									choose “Its own 360° video”.
								</>
							)}
						</p>
					) : (
						<>
							<p className="a-hint a-hint--top a-hint--after">
								Choose the ring’s 360° turntable video (MP4).
								Your browser turns it into {SPIN_FRAMES} frames,
								removes a white studio background and uploads
								the frames; the video itself is not uploaded.
								The same ring is shown once, then as four rings
								from different sides.
							</p>
							<SpinMaker
								frames={values.spin}
								error={errors.spin}
								onUploaded={(publicId) => unsaved.add(publicId)}
								onChange={(spin) => set('spin', spin)}
							/>
						</>
					)}
				</section>

				<section className="a-card" aria-labelledby="sec-text">
					<h2 id="sec-text" className="a-card__title">
						Text
					</h2>
					<Field
						label="Small line above the heading"
						name="eyebrow"
						value={values.eyebrow}
						error={errors.eyebrow}
						maxLength={MAKING_LIMITS.eyebrow}
						required
						hint={`For example “${makingEyebrow(banner?.name || 'Dome Pavé')}”. Update it when you change the ring.`}
						onChange={(v) => set('eyebrow', v)}
					/>
					<TextArea
						label="Heading"
						name="heading"
						value={values.heading}
						error={errors.heading}
						maxLength={MAKING_LIMITS.heading}
						required
						rows={2}
						hint="Put *asterisks* around words to show them in gold italics."
						onChange={(v) => set('heading', v)}
					/>
					<div className="a-grid-2">
						{values.stages.map((stage, i) => (
							<Field
								key={i}
								label={`Stage ${String(i + 1).padStart(2, '0')}`}
								name={`stage${i}`}
								value={stage}
								error={errors[`stage${i}`]}
								maxLength={MAKING_LIMITS.stage}
								required
								onChange={(v) =>
									set(
										'stages',
										values.stages.map((s, k) =>
											k === i ? v : s,
										),
										`stage${i}`,
									)
								}
							/>
						))}
					</div>
					<p className="a-hint">
						The four labels under the rings, shown one by one as
						visitors scroll.
					</p>
				</section>
			</div>

			<aside className="a-editor__side">
				<section className="a-card" aria-labelledby="sec-preview">
					<h2 id="sec-preview" className="a-card__title">
						Preview
					</h2>
					<div className="a-making">
						<p className="a-making__eyebrow">
							{values.eyebrow || 'Small line'}
						</p>
						<p className="a-making__heading">
							{splitAccent(values.heading || 'Heading').map(
								(part, i) =>
									part.accent ? (
										<em key={i}>{part.text}</em>
									) : (
										<span key={i}>{part.text}</span>
									),
							)}
						</p>
						<div className="a-making__rings">
							{values.stages.map((stage, i) => (
								<div key={i} className="a-making__ring">
									<span className="a-making__img">
										{preview && (
											<CatalogueImage
												src={
													frames[
														Math.floor(
															(i *
																frames.length) /
																4,
														)
													]?.url ?? preview.url
												}
												alt=""
												fill
												sizes="64px"
											/>
										)}
									</span>
									<span className="a-making__num">
										{String(i + 1).padStart(2, '0')}
									</span>
									<span className="a-making__stage">
										{stage || '—'}
									</span>
								</div>
							))}
						</div>
					</div>
				</section>
				<section className="a-card" aria-labelledby="sec-publish">
					<h2 id="sec-publish" className="a-card__title">
						Publishing
					</h2>
					<Toggle
						showLabel
						label="Show on the home page"
						checked={values.visible}
						onChange={(v) => set('visible', v)}
					/>
					<p className="a-hint">
						Appears after the brand story. Turn off to hide the
						whole section.
					</p>
					<a
						href="/#making"
						target="_blank"
						rel="noreferrer"
						className="a-btn"
					>
						<Icon name="external" /> View on the website
					</a>
				</section>
			</aside>

			<div className="a-savebar">
				<p className="a-savebar__msg" role="status">
					{message ? (
						<span className="a-error">{message}</span>
					) : saved ? (
						'All changes saved — the website has been updated.'
					) : (
						''
					)}
				</p>
				<button
					type="button"
					className="a-btn"
					onClick={reset}
					disabled={pending}
				>
					Undo changes
				</button>
				<button
					type="submit"
					className="a-btn a-btn--gold"
					disabled={pending}
				>
					{pending ? 'Saving…' : 'Save changes'}
				</button>
			</div>
		</form>
	);
}
