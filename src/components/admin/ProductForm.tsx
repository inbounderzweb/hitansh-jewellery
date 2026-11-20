'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, useTransition } from 'react';
import {
	deleteProduct,
	discardUploads,
	saveProduct,
} from '@/app/admin/actions/catalogue';
import { productTags, type ImageAsset } from '@/lib/catalogue';
import type { ProductFormValues } from '@/lib/admin/data';
import {
	LIMITS,
	parseProduct,
	slugify,
	validateProduct,
	type FieldErrors,
} from '@/lib/admin/validation';
import { Field, TextArea } from './Field';
import Icon from './Icon';
import ImageManager from './ImageManager';
import Toggle from './Toggle';

export const EMPTY_PRODUCT: ProductFormValues = {
	name: '',
	slug: '',
	reference: '',
	description: '',
	category: 'Rings',
	design: '',
	gemstone: '',
	metal: '',
	weight: '',
	dimensions: '',
	specs: [],
	tags: [],
	collectionIds: [],
	images: [],
	featured: false,
	visible: false,
};

type Props = {
	id: string | null;
	initial: ProductFormValues;
	collections: { id: string; title: string }[];
	publicSlug?: string;
};

export default function ProductForm({
	id,
	initial,
	collections,
	publicSlug,
}: Props) {
	const router = useRouter();
	const [values, setValues] = useState(initial);
	const [errors, setErrors] = useState<FieldErrors>({});
	const [message, setMessage] = useState('');
	const [saved, setSaved] = useState(false);
	const [pending, start] = useTransition();
	const [slugTouched, setSlugTouched] = useState(!!id);
	const [unsaved] = useState(() => new Set<string>());
	const dirty = useRef(false);

	// Warn before leaving with unsaved changes.
	useEffect(() => {
		const warn = (e: BeforeUnloadEvent) => {
			if (dirty.current) e.preventDefault();
		};
		window.addEventListener('beforeunload', warn);
		return () => window.removeEventListener('beforeunload', warn);
	}, []);

	const set = <K extends keyof ProductFormValues>(
		key: K,
		value: ProductFormValues[K],
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
			if (key === 'name' && !slugTouched)
				next.slug = slugify(String(value));
			return next;
		});
	};

	const toggleIn = <T extends string>(list: T[], item: T) =>
		list.includes(item) ? list.filter((x) => x !== item) : [...list, item];

	const submit = (event: React.FormEvent) => {
		event.preventDefault();
		const found = validateProduct(parseProduct(values));
		setErrors(found);
		if (Object.keys(found).length) {
			setMessage('Please correct the highlighted fields.');
			document
				.querySelector<HTMLElement>(
					`[data-field="${Object.keys(found)[0]}"]`,
				)
				?.scrollIntoView({ behavior: 'smooth', block: 'center' });
			return;
		}
		start(async () => {
			setMessage('');
			const res = await saveProduct(id, values);
			if (!res.ok) {
				setErrors(res.errors ?? {});
				setMessage(res.message ?? 'The product could not be saved.');
				return;
			}
			dirty.current = false;
			unsaved.clear();
			if (!id && res.id) {
				router.replace(`/admin/products/${res.id}?created=1`);
			} else {
				setSaved(true);
				router.refresh();
			}
		});
	};

	const cancel = () => {
		if (dirty.current && !confirm('Discard your unsaved changes?')) return;
		if (unsaved.size) void discardUploads([...unsaved]);
		dirty.current = false;
		router.push('/admin/products');
	};

	const remove = () => {
		if (
			!id ||
			!confirm(
				`Delete “${initial.name}”? This removes it from the website and deletes its uploaded images. This cannot be undone.`,
			)
		)
			return;
		start(async () => {
			const res = await deleteProduct(id);
			if (!res.ok)
				return setMessage(
					res.message ?? 'The product could not be deleted.',
				);
			dirty.current = false;
			router.push('/admin/products');
			router.refresh();
		});
	};

	return (
		<form className="a-form a-editor" onSubmit={submit} noValidate>
			<div className="a-editor__main">
				<section className="a-card" aria-labelledby="sec-basics">
					<h2 id="sec-basics" className="a-card__title">
						Basics
					</h2>
					<div className="a-grid-2">
						<Field
							label="Product name"
							name="name"
							value={values.name}
							error={errors.name}
							maxLength={LIMITS.name}
							required
							onChange={(v) => set('name', v)}
						/>
						<Field
							label="Reference number"
							name="reference"
							value={values.reference}
							error={errors.reference}
							maxLength={LIMITS.reference}
							hint="Shown on the website and in enquiries."
							onChange={(v) => set('reference', v)}
						/>
						<Field
							label="URL slug"
							name="slug"
							value={values.slug}
							error={errors.slug}
							maxLength={LIMITS.slug}
							required
							prefix="/products/"
							hint={
								id
									? 'Changing this changes the page address.'
									: undefined
							}
							onChange={(v) => {
								setSlugTouched(true);
								set('slug', v.toLowerCase());
							}}
						/>
						<Field
							label="Category"
							name="category"
							value={values.category}
							error={errors.category}
							maxLength={LIMITS.short}
							required
							hint="e.g. Rings, Earrings, Pendants"
							onChange={(v) => set('category', v)}
						/>
					</div>
					<TextArea
						label="Description"
						name="description"
						value={values.description}
						error={errors.description}
						maxLength={LIMITS.description}
						rows={6}
						hint="Leave a blank line between paragraphs. The first paragraph is also used for search engines."
						onChange={(v) => set('description', v)}
					/>
				</section>

				<section className="a-card" aria-labelledby="sec-specs">
					<h2 id="sec-specs" className="a-card__title">
						Specifications
					</h2>
					<div className="a-grid-2">
						<Field
							label="Design"
							name="design"
							value={values.design}
							error={errors.design}
							maxLength={LIMITS.short}
							hint="e.g. Pear Halo Ring"
							onChange={(v) => set('design', v)}
						/>
						<Field
							label="Gemstone"
							name="gemstone"
							value={values.gemstone}
							error={errors.gemstone}
							maxLength={LIMITS.short}
							onChange={(v) => set('gemstone', v)}
						/>
						<Field
							label="Metal"
							name="metal"
							value={values.metal}
							error={errors.metal}
							maxLength={LIMITS.short}
							onChange={(v) => set('metal', v)}
						/>
						<Field
							label="Weight"
							name="weight"
							value={values.weight}
							error={errors.weight}
							maxLength={LIMITS.short}
							hint="e.g. 4.2 g"
							onChange={(v) => set('weight', v)}
						/>
						<Field
							label="Dimensions"
							name="dimensions"
							value={values.dimensions}
							error={errors.dimensions}
							maxLength={LIMITS.short}
							hint="e.g. 12 × 9 mm"
							onChange={(v) => set('dimensions', v)}
						/>
					</div>

					<div className="a-specs" data-field="specs">
						<p className="a-label">Other specifications</p>
						{values.specs.map((s, i) => (
							<div key={i} className="a-specs__row">
								<input
									aria-label={`Specification ${i + 1} label`}
									placeholder="Label, e.g. Setting"
									value={s.label}
									maxLength={LIMITS.specLabel}
									onChange={(e) =>
										set(
											'specs',
											values.specs.map((x, j) =>
												j === i
													? {
															...x,
															label: e.target
																.value,
														}
													: x,
											),
										)
									}
								/>
								<input
									aria-label={`Specification ${i + 1} value`}
									placeholder="Value, e.g. Pavé diamond halo"
									value={s.value}
									maxLength={LIMITS.specValue}
									onChange={(e) =>
										set(
											'specs',
											values.specs.map((x, j) =>
												j === i
													? {
															...x,
															value: e.target
																.value,
														}
													: x,
											),
										)
									}
								/>
								<button
									type="button"
									className="a-iconbtn a-iconbtn--danger"
									onClick={() =>
										set(
											'specs',
											values.specs.filter(
												(_, j) => j !== i,
											),
										)
									}
								>
									<Icon name="trash" />
									<span className="a-sr">
										Remove specification {i + 1}
									</span>
								</button>
							</div>
						))}
						{values.specs.length < LIMITS.specs && (
							<button
								type="button"
								className="a-chip"
								onClick={() =>
									set('specs', [
										...values.specs,
										{ label: '', value: '' },
									])
								}
							>
								<Icon name="plus" /> Add specification
							</button>
						)}
						{errors.specs && (
							<p className="a-error" role="alert">
								{errors.specs}
							</p>
						)}
					</div>
				</section>

				<section
					className="a-card"
					aria-labelledby="sec-images"
					data-field="images"
				>
					<h2 id="sec-images" className="a-card__title">
						Images
					</h2>
					<ImageManager
						kind="products"
						label="Product images"
						max={LIMITS.images}
						images={values.images}
						unsaved={unsaved}
						error={errors.images}
						onUploaded={(publicId) => unsaved.add(publicId)}
						onChange={(images: ImageAsset[]) =>
							set('images', images)
						}
					/>
				</section>
			</div>

			<aside className="a-editor__side">
				<section className="a-card" aria-labelledby="sec-publish">
					<h2 id="sec-publish" className="a-card__title">
						Publishing
					</h2>
					<div className="a-stack">
						<Toggle
							showLabel
							label="Visible on the website"
							checked={values.visible}
							onChange={(v) => set('visible', v)}
						/>
						<Toggle
							showLabel
							label="Featured on the home page"
							checked={values.featured}
							onChange={(v) => set('featured', v)}
						/>
					</div>
					{id && publicSlug && initial.visible && (
						<a
							className="a-link"
							href={`/products/${publicSlug}`}
							target="_blank"
							rel="noreferrer"
						>
							<Icon name="external" /> View on website
						</a>
					)}
				</section>

				<section className="a-card" aria-labelledby="sec-collections">
					<h2 id="sec-collections" className="a-card__title">
						Collections
					</h2>
					{collections.length ? (
						<div className="a-checks">
							{collections.map((c) => (
								<label key={c.id} className="a-check">
									<input
										type="checkbox"
										checked={values.collectionIds.includes(
											c.id,
										)}
										onChange={() =>
											set(
												'collectionIds',
												toggleIn(
													values.collectionIds,
													c.id,
												),
											)
										}
									/>
									{c.title}
								</label>
							))}
						</div>
					) : (
						<p className="a-muted">No collections yet.</p>
					)}
				</section>

				<section className="a-card" aria-labelledby="sec-filters">
					<h2 id="sec-filters" className="a-card__title">
						Website filters
					</h2>
					<p className="a-hint">
						Which filter buttons on the website include this piece.
					</p>
					<div className="a-checks">
						{productTags.map((t) => (
							<label key={t.id} className="a-check">
								<input
									type="checkbox"
									checked={values.tags.includes(t.id)}
									onChange={() =>
										set('tags', toggleIn(values.tags, t.id))
									}
								/>
								{t.label}
							</label>
						))}
					</div>
				</section>

				{id && (
					<button
						type="button"
						className="a-btn a-btn--danger"
						onClick={remove}
						disabled={pending}
					>
						<Icon name="trash" /> Delete product
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
							: 'Create product'}
				</button>
			</div>
		</form>
	);
}
