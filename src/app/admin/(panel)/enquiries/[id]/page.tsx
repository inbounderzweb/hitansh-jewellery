import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getEnquiry } from '@/lib/admin/data';
import Icon from '@/components/admin/Icon';
import EnquiryActions from '@/components/admin/EnquiryActions';
import StatusSelect from '@/components/admin/StatusSelect';
import { formatDateTime } from '@/components/admin/format';

export const metadata = { title: 'Enquiry' };

export default async function EnquiryPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const enquiry = await getEnquiry((await params).id);
	if (!enquiry) notFound();
	const subject = enquiry.product
		? `Your enquiry about ${enquiry.product.name}`
		: 'Your consultation request';

	return (
		<>
			<header className="a-head">
				<div>
					<Link href="/admin/enquiries" className="a-back">
						<Icon name="back" /> Enquiries
					</Link>
					<h1 className="a-title">{enquiry.name}</h1>
					<p className="a-muted">
						Received {formatDateTime(enquiry.createdAt)}
					</p>
				</div>
				<StatusSelect
					id={enquiry.id}
					status={enquiry.status}
					label="Enquiry status"
				/>
			</header>

			<div className="a-editor">
				<div className="a-editor__main">
					<section className="a-card" aria-labelledby="sec-message">
						<h2 id="sec-message" className="a-card__title">
							Message
						</h2>
						{enquiry.message ? (
							<p className="a-message">{enquiry.message}</p>
						) : (
							<p className="a-muted">No message was included.</p>
						)}
					</section>
					<EnquiryActions id={enquiry.id} notes={enquiry.notes} />
				</div>

				<aside className="a-editor__side">
					<section className="a-card" aria-labelledby="sec-customer">
						<h2 id="sec-customer" className="a-card__title">
							Customer
						</h2>
						<dl className="a-dl">
							<div>
								<dt>Name</dt>
								<dd>{enquiry.name}</dd>
							</div>
							<div>
								<dt>Email</dt>
								<dd>
									<a
										className="a-link"
										href={`mailto:${enquiry.email}?subject=${encodeURIComponent(subject)}`}
									>
										{enquiry.email}
									</a>
								</dd>
							</div>
							<div>
								<dt>Phone</dt>
								<dd>
									<a
										className="a-link"
										href={`tel:${enquiry.phone.replace(/[^\d+]/g, '')}`}
									>
										{enquiry.phone}
									</a>
								</dd>
							</div>
						</dl>
					</section>
					<section className="a-card" aria-labelledby="sec-product">
						<h2 id="sec-product" className="a-card__title">
							Product
						</h2>
						{enquiry.product ? (
							<dl className="a-dl">
								<div>
									<dt>Name</dt>
									<dd>{enquiry.product.name}</dd>
								</div>
								<div>
									<dt>Reference</dt>
									<dd>{enquiry.product.reference ?? '—'}</dd>
								</div>
								<div>
									<dt>Page</dt>
									<dd>
										<a
											className="a-link"
											href={`/products/${enquiry.product.slug}`}
											target="_blank"
											rel="noreferrer"
										>
											/products/{enquiry.product.slug}
										</a>
									</dd>
								</div>
							</dl>
						) : (
							<p className="a-muted">
								General consultation request (no specific
								product).
							</p>
						)}
					</section>
				</aside>
			</div>
		</>
	);
}
