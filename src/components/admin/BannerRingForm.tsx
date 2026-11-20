'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, useTransition } from 'react';
import { deleteBannerRing, saveBannerRing } from '@/app/admin/actions/banner';
import { discardUploads } from '@/app/admin/actions/catalogue';
import type { BannerRingFormValues } from '@/lib/admin/data';
import {
	parseBannerRing,
	validateBannerRing,
	type FieldErrors,
} from '@/lib/admin/validation';
import { glowRgba } from '@/lib/banner';
import CatalogueImage from '@/components/catalogue/CatalogueImage';
import { Field } from './Field';
import Icon from './Icon';
import ImageManager from './ImageManager';
import Toggle from './Toggle';

export const EMPTY_RING: BannerRingFormValues = {
	name: '',
	alt: '',
	image: null,
	glow: '#d4b06a',
	productId: '',
	visible: true,
};

type ProductOption = { id: string; name: string; reference?: string };

export default function BannerRingForm({
	id,
	initial,
	products,
}: {
	id: string | null;
	initial: BannerRingFormValues;
	products: ProductOption[];
}) {
	const router = useRouter();
	const [values, setValues] = useState(initial);
	const [errors, setErrors] = useState<FieldErrors>({});
	const [message, setMessage] = useState('');
	const [saved, setSaved] = useState(false);
	const [pending, start] = useTransition();
	const [unsaved] = useState(() => new Set<string>());
	const dirty = useRef(false);

	useEffect(() => {
		const warn = (e: BeforeUnloadEvent) => {
			if (dirty.current) e.preventDefault();
		};
		window.addEventListener('beforeunload', warn);
		return () => window.removeEventListener('beforeunload', warn);
	}, []);

	const set = <K extends keyof BannerRingFormValues>(
		key: K,
		value: BannerRingFormValues[K],
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
		const found = validateBannerRing(parseBannerRing(values));
		setErrors(found);
		if (Object.keys(found).length)
			return setMessage('Please correct the highlighted fields.');
		start(async () => {
			setMessage('');
			const res = await saveBannerRing(id, values);
			if (!res.ok) {
				setErrors(res.errors ?? {});
				setMessage(res.message ?? 'The ring could not be saved.');
				return;
			}
			dirty.current = false;
			unsaved.clear();
			if (!id && res.id)
				router.replace(`/admin/banner/${res.id}?created=1`);
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
		router.push('/admin/banner');
	};

	const remove = () => {
		if (
			!id ||
			!confirm(
				`Delete the “${initial.name}” ring? Its uploaded image is deleted too. This cannot be undone.`,
			)
		)
			return;
		start(async () => {
			const res = await deleteBannerRing(id);
			if (!res.ok)
				return setMessage(
					res.message ?? 'The ring could not be deleted.',
				);
			dirty.current = false;
			router.push('/admin/banner');
			router.refresh();
		});
	};

	return (
		<form className="a-form a-editor" onSubmit={submit} noValidate>
			<div className="a-editor__main">
				<section className="a-card" aria-labelledby="sec-ring">
					<h2 id="sec-ring" className="a-card__title">
						Ring
					</h2>
					<div className="a-grid-2">
						<Field
							label="Name"
							name="name"
							value={values.name}
							error={errors.name}
							maxLength={60}
							required
							hint="Shown under the ring in the banner."
							onChange={(v) => set('name', v)}
						/>
						<div className="a-field" data-field="productId">
							<label htmlFor="ring-product">
								Links to
								<span className="a-opt">Optional</span>
							</label>
							<select
								id="ring-product"
								className="a-select"
								value={values.productId}
								onChange={(e) =>
									set('productId', e.target.value)
								}
							>
								<option value="">The catalogue page</option>
								{products.map((p) => (
									<option key={p.id} value={p.id}>
										{p.name}
										{p.reference
											? ` (Ref. ${p.reference})`
											: ''}
									</option>
								))}
							</select>
							<p className="a-hint">
								Hidden products fall back to the catalogue page.
							</p>
						</div>
					</div>
					<Field
						label="Image description (alt text)"
						name="alt"
						value={values.alt}
						error={errors.alt}
						maxLength={200}
						hint="For screen readers and search engines, e.g. “Aurora — white diamond pear halo ring in platinum”. Defaults to the name."
						onChange={(v) => set('alt', v)}
					/>
					<div className="a-field" data-field="glow">
						<label htmlFor="ring-glow">Glow colour</label>
						<div className="a-colour">
							<input
								id="ring-glow"
								type="color"
								value={values.glow}
								onChange={(e) => set('glow', e.target.value)}
							/>
							<span>{values.glow}</span>
						</div>
						<p className="a-hint">
							The soft light behind the ring. Match it to the
							gemstone.
						</p>
						{errors.glow && (
							<p className="a-error" role="alert">
								{errors.glow}
							</p>
						)}
					</div>
				</section>

				<section
					className="a-card"
					aria-labelledby="sec-image"
					data-field="image"
				>
					<h2 id="sec-image" className="a-card__title">
						Image
					</h2>
					<p className="a-hint a-hint--top">
						Use a ring render on a transparent or dark navy
						background, square or portrait, at least 1000 px wide.
					</p>
					<ImageManager
						kind="banner"
						label="Ring image"
						max={1}
						images={values.image ? [values.image] : []}
						unsaved={unsaved}
						error={errors.image}
						onUploaded={(publicId) => unsaved.add(publicId)}
						onChange={(images) => set('image', images[0] ?? null)}
					/>
				</section>
			</div>

			<aside className="a-editor__side">
				<section className="a-card" aria-labelledby="sec-preview">
					<h2 id="sec-preview" className="a-card__title">
						Preview
					</h2>
					<div
						className="a-ringpreview"
						style={
							{
								'--ring-glow': glowRgba(values.glow, 0.5),
							} as React.CSSProperties
						}
					>
						{values.image ? (
							<CatalogueImage
								src={values.image.url}
								alt=""
								fill
								sizes="280px"
							/>
						) : (
							<span className="a-muted">No image yet</span>
						)}
					</div>
					<p className="a-ringpreview__name">
						{values.name || 'Name'}
					</p>
				</section>
				<section className="a-card" aria-labelledby="sec-publish">
					<h2 id="sec-publish" className="a-card__title">
						Publishing
					</h2>
					<Toggle
						showLabel
						label="Visible in the banner"
						checked={values.visible}
						onChange={(v) => set('visible', v)}
					/>
					<p className="a-hint">
						The banner shows the first four visible rings in the
						list order.
					</p>
				</section>
				{id && (
					<button
						type="button"
						className="a-btn a-btn--danger"
						onClick={remove}
						disabled={pending}
					>
						<Icon name="trash" /> Delete ring
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
					{pending ? 'Saving…' : id ? 'Save changes' : 'Add ring'}
				</button>
			</div>
		</form>
	);
}
