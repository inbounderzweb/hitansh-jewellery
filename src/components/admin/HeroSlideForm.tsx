'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, useTransition } from 'react';
import { deleteHeroSlide, saveHeroSlide } from '@/app/admin/actions/hero';
import type { HeroSlideFormValues } from '@/lib/admin/data';
import {
	parseHeroSlide,
	validateHeroSlide,
	type FieldErrors,
} from '@/lib/admin/validation';
import {
	EXPLORE_FILTERS,
	GEM_OPTIONS,
	HERO_LIMITS,
	HERO_MAX_SLIDES,
	METAL_OPTIONS,
	heroGlows,
} from '@/lib/hero';
import { Field, TextArea } from './Field';
import { HeroSwatch } from './HeroTable';
import Icon from './Icon';
import Toggle from './Toggle';

export const EMPTY_SLIDE: HeroSlideFormValues = {
	name: '',
	collection: '',
	description: '',
	gem: 'Diamond White',
	metal: 'Platinum',
	filterTarget: 'all',
	glow: '#d4b06a',
	visible: true,
};

type CollectionOption = { slug: string; title: string; visible: boolean };

function Select({
	id,
	label,
	name,
	value,
	error,
	hint,
	onChange,
	children,
}: {
	id: string;
	label: string;
	name: string;
	value: string;
	error?: string;
	hint?: string;
	onChange: (v: string) => void;
	children: React.ReactNode;
}) {
	return (
		<div className="a-field" data-field={name}>
			<label htmlFor={id}>{label}</label>
			<select
				id={id}
				className="a-select"
				value={value}
				aria-invalid={error ? true : undefined}
				onChange={(e) => onChange(e.target.value)}
			>
				{children}
			</select>
			{hint && <p className="a-hint">{hint}</p>}
			{error && (
				<p className="a-error" role="alert">
					{error}
				</p>
			)}
		</div>
	);
}

export default function HeroSlideForm({
	id,
	initial,
	collections,
}: {
	id: string | null;
	initial: HeroSlideFormValues;
	collections: CollectionOption[];
}) {
	const router = useRouter();
	const [values, setValues] = useState(initial);
	const [errors, setErrors] = useState<FieldErrors>({});
	const [message, setMessage] = useState('');
	const [saved, setSaved] = useState(false);
	const [pending, start] = useTransition();
	const dirty = useRef(false);

	useEffect(() => {
		const warn = (e: BeforeUnloadEvent) => {
			if (dirty.current) e.preventDefault();
		};
		window.addEventListener('beforeunload', warn);
		return () => window.removeEventListener('beforeunload', warn);
	}, []);

	const set = <K extends keyof HeroSlideFormValues>(
		key: K,
		value: HeroSlideFormValues[K],
	) => {
		dirty.current = true;
		setSaved(false);
		setErrors((e) => {
			if (!(key in e)) return e;
			const rest = { ...e };
			delete rest[key];
			return rest;
		});
		setValues((v) => ({ ...v, [key]: value }));
	};

	const submit = (event: React.FormEvent) => {
		event.preventDefault();
		const found = validateHeroSlide(parseHeroSlide(values));
		setErrors(found);
		if (Object.keys(found).length)
			return setMessage('Please correct the highlighted fields.');
		start(async () => {
			setMessage('');
			const res = await saveHeroSlide(id, values);
			if (!res.ok) {
				setErrors(res.errors ?? {});
				setMessage(res.message ?? 'The slide could not be saved.');
				return;
			}
			dirty.current = false;
			if (!id && res.id)
				router.replace(`/admin/hero/${res.id}?created=1`);
			else {
				setSaved(true);
				router.refresh();
			}
		});
	};

	const cancel = () => {
		if (dirty.current && !confirm('Discard your unsaved changes?')) return;
		dirty.current = false;
		router.push('/admin/hero');
	};

	const remove = () => {
		if (
			!id ||
			!confirm(
				`Delete the “${initial.name}” slide? This cannot be undone.`,
			)
		)
			return;
		start(async () => {
			const res = await deleteHeroSlide(id);
			if (!res.ok)
				return setMessage(
					res.message ?? 'The slide could not be deleted.',
				);
			dirty.current = false;
			router.push('/admin/hero');
			router.refresh();
		});
	};

	const known =
		EXPLORE_FILTERS.some((f) => f.id === values.filterTarget) ||
		collections.some((c) => `collection:${c.slug}` === values.filterTarget);
	const glows = heroGlows(
		/^#[0-9a-f]{6}$/i.test(values.glow) ? values.glow : '#d4b06a',
	);

	return (
		<form className="a-form a-editor" onSubmit={submit} noValidate>
			<div className="a-editor__main">
				<section className="a-card" aria-labelledby="sec-copy">
					<h2 id="sec-copy" className="a-card__title">
						Text
					</h2>
					<div className="a-grid-2">
						<Field
							label="Ring name"
							name="name"
							value={values.name}
							error={errors.name}
							maxLength={HERO_LIMITS.name}
							required
							hint="The large title, e.g. “Aurora”."
							onChange={(v) => set('name', v)}
						/>
						<Field
							label="Collection line"
							name="collection"
							value={values.collection}
							error={errors.collection}
							maxLength={HERO_LIMITS.collection}
							hint="Small line above the name, e.g. “Bridal Solitaire”."
							onChange={(v) => set('collection', v)}
						/>
					</div>
					<TextArea
						label="Description"
						name="description"
						value={values.description}
						error={errors.description}
						maxLength={HERO_LIMITS.description}
						required
						rows={3}
						onChange={(v) => set('description', v)}
					/>
				</section>

				<section className="a-card" aria-labelledby="sec-look">
					<h2 id="sec-look" className="a-card__title">
						3D ring
					</h2>
					<p className="a-hint a-hint--top">
						The banner shows one 3D ring model. Each slide recolours
						its centre stone and metal.
					</p>
					<div className="a-grid-2">
						<Select
							id="slide-gem"
							label="Centre stone"
							name="gem"
							value={values.gem}
							error={errors.gem}
							onChange={(v) => set('gem', v)}
						>
							{GEM_OPTIONS.map((g) => (
								<option key={g.value} value={g.value}>
									{g.label}
								</option>
							))}
						</Select>
						<Select
							id="slide-metal"
							label="Metal"
							name="metal"
							value={values.metal}
							error={errors.metal}
							onChange={(v) => set('metal', v)}
						>
							{METAL_OPTIONS.map((m) => (
								<option key={m.value} value={m.value}>
									{m.label}
								</option>
							))}
						</Select>
					</div>
					<div className="a-field" data-field="glow">
						<label htmlFor="slide-glow">Glow colour</label>
						<div className="a-colour">
							<input
								id="slide-glow"
								type="color"
								value={values.glow}
								onChange={(e) => set('glow', e.target.value)}
							/>
							<span>{values.glow}</span>
						</div>
						<p className="a-hint">
							The soft light behind the ring. Match it to the
							stone.
						</p>
						{errors.glow && (
							<p className="a-error" role="alert">
								{errors.glow}
							</p>
						)}
					</div>
				</section>

				<section className="a-card" aria-labelledby="sec-explore">
					<h2 id="sec-explore" className="a-card__title">
						Explore button
					</h2>
					<Select
						id="slide-explore"
						label="“Explore Collection” shows"
						name="filterTarget"
						value={values.filterTarget}
						error={errors.filterTarget}
						hint="Scrolls to the product grid with this filter. Hidden or deleted collections show all pieces."
						onChange={(v) => set('filterTarget', v)}
					>
						{!known && (
							<option value={values.filterTarget}>
								Deleted collection (shows all pieces)
							</option>
						)}
						<optgroup label="Pieces">
							{EXPLORE_FILTERS.map((f) => (
								<option key={f.id} value={f.id}>
									{f.label}
								</option>
							))}
						</optgroup>
						{collections.length > 0 && (
							<optgroup label="Collections">
								{collections.map((c) => (
									<option
										key={c.slug}
										value={`collection:${c.slug}`}
									>
										{c.title}
										{c.visible ? '' : ' (hidden)'}
									</option>
								))}
							</optgroup>
						)}
					</Select>
				</section>
			</div>

			<aside className="a-editor__side">
				<section className="a-card" aria-labelledby="sec-preview">
					<h2 id="sec-preview" className="a-card__title">
						Preview
					</h2>
					<div
						className="a-heropreview"
						style={
							{
								'--hp-glow': glows.glowPrimary,
								'--hp-glow-2': glows.glowSecondary,
							} as React.CSSProperties
						}
					>
						<HeroSwatch
							gem={values.gem}
							metal={values.metal}
							glow={values.glow}
							size={96}
						/>
						<p className="a-heropreview__eyebrow">
							{values.collection || 'Collection line'}
						</p>
						<p className="a-heropreview__name">
							{values.name || 'Ring name'}
						</p>
						<p className="a-heropreview__desc">
							{values.description || 'Description'}
						</p>
					</div>
				</section>
				<section className="a-card" aria-labelledby="sec-publish">
					<h2 id="sec-publish" className="a-card__title">
						Publishing
					</h2>
					<Toggle
						showLabel
						label="Visible in the 3D banner"
						checked={values.visible}
						onChange={(v) => set('visible', v)}
					/>
					<p className="a-hint">
						The banner shows up to {HERO_MAX_SLIDES} visible slides
						in the list order.
					</p>
				</section>
				{id && (
					<button
						type="button"
						className="a-btn a-btn--danger"
						onClick={remove}
						disabled={pending}
					>
						<Icon name="trash" /> Delete slide
					</button>
				)}
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
					onClick={cancel}
					disabled={pending}
				>
					{id ? 'Back' : 'Cancel'}
				</button>
				<button
					type="submit"
					className="a-btn a-btn--gold"
					disabled={pending}
				>
					{pending ? 'Saving…' : id ? 'Save changes' : 'Add slide'}
				</button>
			</div>
		</form>
	);
}
