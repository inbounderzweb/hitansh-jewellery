'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState, useTransition } from 'react';
import { deleteMedia } from '@/app/admin/actions/media';
import type { MediaEntry, MediaFolder } from '@/lib/admin/media';
import { cloudinaryUrl } from '@/lib/images';
import Icon from './Icon';

/** Uploads this recent may belong to a form that isn't saved yet. */
const RECENT_MS = 60 * 60 * 1000;

const size = (bytes: number) =>
	bytes >= 1024 * 1024
		? `${(bytes / 1024 / 1024).toFixed(1)} MB`
		: `${Math.max(1, Math.round(bytes / 1024))} KB`;

const date = (iso: string) =>
	new Date(iso).toLocaleDateString('en-IN', {
		day: 'numeric',
		month: 'short',
		year: 'numeric',
	});

export default function MediaLibrary({
	entries,
	folders,
	now,
}: {
	entries: MediaEntry[];
	folders: Record<MediaFolder, string>;
	/** Server time, so "recent" is the same on server and client. */
	now: number;
}) {
	const router = useRouter();
	const [folder, setFolder] = useState<MediaFolder | 'all'>('all');
	const [unusedOnly, setUnusedOnly] = useState(false);
	const [query, setQuery] = useState('');
	const [copied, setCopied] = useState('');
	const [pending, start] = useTransition();
	const [message, setMessage] = useState('');

	const recent = (e: MediaEntry) =>
		now - new Date(e.createdAt).getTime() < RECENT_MS;

	const shown = useMemo(() => {
		const q = query.trim().toLowerCase();
		return entries.filter(
			(e) =>
				(folder === 'all' || e.folder === folder) &&
				(!unusedOnly || !e.usedIn.length) &&
				(!q ||
					e.name.toLowerCase().includes(q) ||
					e.usedIn.some((u) => u.label.toLowerCase().includes(q))),
		);
	}, [entries, folder, unusedOnly, query]);

	const counts = useMemo(() => {
		const c: Partial<Record<MediaFolder, number>> = {};
		for (const e of entries) c[e.folder] = (c[e.folder] ?? 0) + 1;
		return c;
	}, [entries]);

	const unused = entries.filter((e) => !e.usedIn.length);
	// If nothing at all is in use, the database is likely not the website's
	// (wrong connection): never offer to delete everything then.
	const anyUsed = entries.some((e) => e.usedIn.length);
	const removable = anyUsed ? unused.filter((e) => !recent(e)) : [];
	const total = entries.reduce((n, e) => n + e.bytes, 0);

	const remove = (list: MediaEntry[], question: string) => {
		if (!list.length || !confirm(question)) return;
		start(async () => {
			setMessage('');
			await deleteMedia(list.flatMap((e) => e.publicIds));
			setMessage(
				list.length === 1
					? 'File deleted.'
					: `${list.length} unused files deleted.`,
			);
			router.refresh();
		});
	};

	const copy = async (e: MediaEntry) => {
		try {
			await navigator.clipboard.writeText(e.url);
			setCopied(e.key);
			setTimeout(() => setCopied(''), 1500);
		} catch {
			window.prompt('Copy the link:', e.url);
		}
	};

	return (
		<>
			<div className="a-stats a-media__stats">
				<div className="a-stat">
					<p className="a-stat__label">Files</p>
					<p className="a-stat__value">{entries.length}</p>
					<p className="a-stat__note">
						360° spins count as one ({size(total)} in all)
					</p>
				</div>
				<div className="a-stat">
					<p className="a-stat__label">Not used</p>
					<p className="a-stat__value">{unused.length}</p>
					<p className="a-stat__note">
						{size(unused.reduce((n, e) => n + e.bytes, 0))} that can
						be freed
					</p>
				</div>
			</div>

			{!anyUsed && entries.length > 0 && (
				<p className="a-alert" role="alert">
					None of these files is used by a product, collection, banner
					or section, so bulk delete is turned off. If the website
					does show these images, check the database connection before
					deleting anything.
				</p>
			)}
			<section className="a-card a-card--flush">
				<div className="a-toolbar a-toolbar--wrap">
					<nav className="a-tabs a-media__tabs" aria-label="Folder">
						{(
							[
								['all', 'All', entries.length],
								...(
									Object.entries(folders) as [
										MediaFolder,
										string,
									][]
								)
									.filter(([f]) => counts[f])
									.map(
										([f, label]) =>
											[f, label, counts[f]!] as const,
									),
							] as const
						).map(([f, label, n]) => (
							<button
								key={f}
								type="button"
								className="a-tab"
								aria-current={folder === f ? 'page' : undefined}
								onClick={() => setFolder(f)}
							>
								{label} <span className="a-muted">{n}</span>
							</button>
						))}
					</nav>
					<label className="a-search">
						<Icon name="search" />
						<span className="a-sr">Search files</span>
						<input
							type="search"
							placeholder="Search by name or where it’s used"
							value={query}
							onChange={(e) => setQuery(e.target.value)}
						/>
					</label>
				</div>
				<div className="a-toolbar a-toolbar--wrap">
					<label className="a-check">
						<input
							type="checkbox"
							checked={unusedOnly}
							onChange={(e) => setUnusedOnly(e.target.checked)}
						/>
						Show only files not used on the website
					</label>
					<div className="a-row">
						{message && (
							<p className="a-success" role="status">
								{message}
							</p>
						)}
						<button
							type="button"
							className="a-btn a-btn--danger"
							disabled={pending || !removable.length}
							onClick={() =>
								remove(
									removable,
									`Permanently delete ${removable.length} unused file${removable.length === 1 ? '' : 's'} from Cloudinary? Files used on the website are never deleted. This cannot be undone.`,
								)
							}
						>
							<Icon name="trash" />
							{pending
								? 'Deleting…'
								: `Delete unused files (${removable.length})`}
						</button>
					</div>
				</div>

				{shown.length ? (
					<ul className="a-media">
						{shown.map((e) => (
							<li key={e.key} className="a-media__item">
								<a
									href={e.url}
									target="_blank"
									rel="noreferrer"
									className="a-media__thumb"
									title="Open the file"
								>
									{e.preview ? (
										// eslint-disable-next-line @next/next/no-img-element -- Cloudinary thumbnail
										<img
											src={cloudinaryUrl(e.preview, {
												width: 360,
											})}
											alt={e.name}
											loading="lazy"
										/>
									) : (
										<span className="a-media__model">
											<Icon name="ring" />
											GLB
										</span>
									)}
									{e.type === 'spin' && (
										<span className="a-media__badge">
											360° · {e.frames}
										</span>
									)}
								</a>
								<div className="a-media__body">
									<p className="a-media__name" title={e.name}>
										{e.name}
									</p>
									<p className="a-media__meta">
										{[
											e.width &&
												e.height &&
												`${e.width}×${e.height}`,
											e.format?.toUpperCase(),
											size(e.bytes),
											date(e.createdAt),
										]
											.filter(Boolean)
											.join(' · ')}
									</p>
									{e.usedIn.length ? (
										<ul className="a-media__uses">
											{e.usedIn.map((u) => (
												<li key={u.label}>
													<Link
														href={u.href}
														className="a-link"
													>
														{u.label}
													</Link>
												</li>
											))}
										</ul>
									) : (
										<p className="a-media__unused">
											{recent(e)
												? 'Not used yet · just uploaded'
												: 'Not used on the website'}
										</p>
									)}
								</div>
								<div className="a-media__actions">
									<button
										type="button"
										className="a-iconbtn"
										onClick={() => void copy(e)}
										title="Copy link"
									>
										<Icon name="link" />
										<span className="a-sr">Copy link</span>
									</button>
									<span
										className="a-muted a-media__copied"
										aria-live="polite"
									>
										{copied === e.key ? 'Link copied' : ''}
									</span>
									{!e.usedIn.length && (
										<button
											type="button"
											className="a-iconbtn a-iconbtn--danger"
											disabled={pending}
											title="Delete"
											onClick={() =>
												remove(
													[e],
													`Permanently delete “${e.name}” from Cloudinary?${recent(e) ? ' It was uploaded in the last hour — if it is in a form you haven’t saved yet, that form will lose it.' : ''} This cannot be undone.`,
												)
											}
										>
											<Icon name="trash" />
											<span className="a-sr">
												Delete {e.name}
											</span>
										</button>
									)}
								</div>
							</li>
						))}
					</ul>
				) : (
					<p className="a-empty">
						{entries.length
							? 'No files match.'
							: 'Nothing has been uploaded yet.'}
					</p>
				)}
			</section>
		</>
	);
}
