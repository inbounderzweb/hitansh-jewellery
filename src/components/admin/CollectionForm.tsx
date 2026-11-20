'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, useTransition } from 'react';
import {
	deleteCollection,
	discardUploads,
	saveCollection,
} from '@/app/admin/actions/catalogue';
import type { CollectionFormValues } from '@/lib/admin/data';
import {
	LIMITS,
	parseCollection,
	slugify,
	validateCollection,
	type FieldErrors,
} from '@/lib/admin/validation';
import { Field, TextArea } from './Field';
import Icon from './Icon';
import ImageManager from './ImageManager';
import Thumb from './Thumb';
import Toggle from './Toggle';

export const EMPTY_COLLECTION: CollectionFormValues = {
	title: '',
	slug: '',
	description: '',
	cover: null,
	visible: false,
	productIds: [],
};

type ProductOption = {
	id: string;
	name: string;
	reference?: string;
	thumb?: string;
};

export default function CollectionForm({
	id,
	initial,
	products,
}: {
	id: string | null;
	initial: CollectionFormValues;
	products: ProductOption[];
}) {
	const router = useRouter();
	const [values, setValues] = useState(initial);
	const [errors, setErrors] = useState<FieldErrors>({});
	const [message, setMessage] = useState('');
	const [saved, setSaved] = useState(false);
	const [pending, start] = useTransition();
	const [slugTouched, setSlugTouched] = useState(!!id);
	const [query, setQuery] = useState('');
	const [unsaved] = useState(() => new Set<string>());
	const dirty = useRef(false);

	useEffect(() => {
		const warn = (e: BeforeUnloadEvent) => {
			if (dirty.current) e.preventDefault();
		};
		window.addEventListener('beforeunload', warn);
		return () => window.removeEventListener('beforeunload', warn);
	}, []);

	const set = <K extends keyof CollectionFormValues>(
		key: K,
		value: CollectionFormValues[K],
	) => {
		dirty.current = true;
		setErrors((e) => {
			if (!(key in e)) return e;
			const rest = { ...e };
			delete rest[key];
			return rest;
		});
		setSaved(false);
		setValues((v) => {
			const next = { ...v, [key]: value };
			if (key === 'title' && !slugTouched)
				next.slug = slugify(String(value));
			return next;
		});
	};

	const submit = (event: React.FormEvent) => {
		event.preventDefault();
		const found = validateCollection(parseCollection(values));
		setErrors(found);
		if (Object.keys(found).length)
			return setMessage('Please correct the highlighted fields.');
		start(async () => {
			setMessage('');
			const res = await saveCollection(id, values);
			if (!res.ok) {
				setErrors(res.errors ?? {});
				setMessage(res.message ?? 'The collection could not be saved.');
				return;
			}
			dirty.current = false;
			unsaved.clear();
			if (!id && res.id)
				router.replace(`/admin/collections/${res.id}?created=1`);
			else {
				setSaved(true);
				router.refresh();
			}
		});
	};

	const cancel = () => {
		if (dirty.current && !confirm('Discard your unsaved changes?')) return;
		if (unsaved.size) void discardUploads([...unsaved]);
		dirty.current = false;
		router.push('/admin/collections');
	};

	const remove = () => {
		if (
			!id ||
			!confirm(
				`Delete the “${initial.title}” collection? Its products are kept.`,
			)
		)
			return;
		start(async () => {
			const res = await deleteCollection(id);
			if (!res.ok)
				return setMessage(
					res.message ?? 'The collection could not be deleted.',
				);
			dirty.current = false;
			router.push('/admin/collections');
			router.refresh();
		});
	};

	const term = query.trim().toLowerCase();
	const shown = term
		? products.filter((p) =>
				`${p.name} ${p.reference ?? ''}`.toLowerCase().includes(term),
			)
		: products;
	const selected = new Set(values.productIds);

	return (
		<form className="a-form a-editor" onSubmit={submit} noValidate>
			<div className="a-editor__main">
				<section className="a-card" aria-labelledby="sec-details">
					<h2 id="sec-details" className="a-card__title">
						Details
					</h2>
					<div className="a-grid-2">
						<Field
							label="Title"
							name="title"
							value={values.title}
							error={errors.title}
							maxLength={80}
							required
							onChange={(v) => set('title', v)}
						/>
						<Field
							label="URL slug"
							name="slug"
							value={values.slug}
							error={errors.slug}
							maxLength={LIMITS.slug}
							required
							hint="Used in filter links, e.g. /products?filter=collection:bridal"
							onChange={(v) => {
								setSlugTouched(true);
								set('slug', v.toLowerCase());
							}}
						/>
					</div>
					<TextArea
						label="Description"
						name="description"
						value={values.description}
						error={errors.description}
						maxLength={LIMITS.collectionDescription}
						rows={3}
						onChange={(v) => set('description', v)}
					/>
				</section>

				<section className="a-card" aria-labelledby="sec-products">
					<div className="a-card__head">
						<h2 id="sec-products" className="a-card__title">
							Products in this collection
						</h2>
						<span className="a-muted">
							{selected.size} selected
						</span>
					</div>
					<label className="a-search">
						<Icon name="search" />
						<span className="a-sr">Filter products</span>
						<input
							type="search"
							placeholder="Filter products…"
							value={query}
							onChange={(e) => setQuery(e.target.value)}
						/>
					</label>
					{products.length ? (
						<ul className="a-picker">
							{shown.map((p) => (
								<li key={p.id}>
									<label className="a-picker__row">
										<input
											type="checkbox"
											checked={selected.has(p.id)}
											onChange={() =>
												set(
													'productIds',
													selected.has(p.id)
														? values.productIds.filter(
																(x) =>
																	x !== p.id,
															)
														: [
																...values.productIds,
																p.id,
															],
												)
											}
										/>
										<Thumb src={p.thumb} size={40} />
										<span>
											{p.name}
											{p.reference && (
												<span className="a-muted">
													{' '}
													· Ref. {p.reference}
												</span>
											)}
										</span>
									</label>
								</li>
							))}
						</ul>
					) : (
						<p className="a-muted">Add products first.</p>
					)}
				</section>
			</div>

			<aside className="a-editor__side">
				<section
					className="a-card"
					aria-labelledby="sec-cover"
					data-field="cover"
				>
					<h2 id="sec-cover" className="a-card__title">
						Cover image
					</h2>
					<ImageManager
						kind="collections"
						label="Cover image"
						max={1}
						images={values.cover ? [values.cover] : []}
						unsaved={unsaved}
						error={errors.cover}
						onUploaded={(publicId) => unsaved.add(publicId)}
						onChange={(images) => set('cover', images[0] ?? null)}
					/>
				</section>
				<section className="a-card" aria-labelledby="sec-publish">
					<h2 id="sec-publish" className="a-card__title">
						Publishing
					</h2>
					<Toggle
						showLabel
						label="Visible on the website"
						checked={values.visible}
						onChange={(v) => set('visible', v)}
					/>
				</section>
				{id && (
					<button
						type="button"
						className="a-btn a-btn--danger"
						onClick={remove}
						disabled={pending}
					>
						<Icon name="trash" /> Delete collection
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
					{pending
						? 'Saving…'
						: id
							? 'Save changes'
							: 'Create collection'}
				</button>
			</div>
		</form>
	);
}
