import { brand } from '@/content/site';
import { staticCatalogue } from '@/lib/catalogue';
import { collections, isDbConfigured } from '@/lib/db/mongo';
import type { EnquiryDoc } from '@/lib/db/types';
import { clientIp, hit } from '@/lib/rateLimit';
import {
	normaliseEnquiry,
	validateEnquiry,
	type EnquiryInput,
} from '@/lib/enquiry';

/**
 * POST /api/enquiry — "Enquire now" / consultation requests.
 *
 * 1. Saved to MongoDB (`enquiries`), where the admin panel lists them.
 * 2. Also forwarded as JSON to `ENQUIRY_WEBHOOK_URL`, if set (e.g. an email
 *    or CRM automation), so the team is notified.
 *
 * The visitor gets a success response if either step succeeded. With
 * neither configured the route answers 503 `not-configured` and the form
 * falls back to the visitor's email app, so no enquiry is silently lost.
 */

const str = (value: unknown) => (typeof value === 'string' ? value : '');

type ProductRef = NonNullable<EnquiryDoc['product']>;

/** Product details come from the catalogue, never from the client. */
async function findProduct(slug: string): Promise<ProductRef | null> {
	if (!slug) return null;
	if (isDbConfigured()) {
		const { products } = await collections();
		const doc = await products.findOne(
			{ slug },
			{ projection: { slug: 1, name: 1, reference: 1 } },
		);
		if (doc)
			return {
				id: doc._id.toHexString(),
				slug: doc.slug,
				name: doc.name,
				...(doc.reference && { reference: doc.reference }),
			};
	}
	const p = staticCatalogue().products.find((x) => x.slug === slug);
	return p
		? {
				slug: p.slug,
				name: p.name,
				...(p.reference && { reference: p.reference }),
			}
		: null;
}

export async function POST(request: Request) {
	let body: Record<string, unknown>;
	try {
		body = await request.json();
	} catch {
		return Response.json({ ok: false, reason: 'invalid' }, { status: 400 });
	}

	// Honeypot: real visitors never see or fill this field.
	if (str(body.company)) return Response.json({ ok: true });

	const input: EnquiryInput = {
		name: str(body.name),
		email: str(body.email),
		phone: str(body.phone),
		message: str(body.message),
	};
	const errors = validateEnquiry(input);
	if (Object.keys(errors).length) {
		return Response.json(
			{ ok: false, reason: 'invalid', errors },
			{ status: 422 },
		);
	}

	const webhook = process.env.ENQUIRY_WEBHOOK_URL;
	const hasDb = isDbConfigured();
	if (!hasDb && !webhook) {
		return Response.json(
			{ ok: false, reason: 'not-configured' },
			{ status: 503 },
		);
	}

	if (hasDb) {
		try {
			const { allowed } = await hit(
				`enquiry:${await clientIp()}`,
				8,
				600,
			);
			if (!allowed)
				return Response.json(
					{ ok: false, reason: 'rate-limited' },
					{ status: 429 },
				);
		} catch (error) {
			console.error('Enquiry rate limit unavailable', error);
		}
	}

	const enquiry = normaliseEnquiry(input);
	let product: ProductRef | null = null;
	try {
		product = await findProduct(str(body.product));
	} catch (error) {
		console.error('Enquiry product lookup failed', error);
	}

	let stored = false;
	if (hasDb) {
		try {
			const now = new Date();
			const { enquiries } = await collections();
			await enquiries.insertOne({
				...enquiry,
				product,
				status: 'new',
				createdAt: now,
				updatedAt: now,
			} as EnquiryDoc);
			stored = true;
		} catch (error) {
			console.error('Enquiry could not be saved', error);
		}
	}

	let delivered = false;
	if (webhook) {
		const origin = new URL(request.url).origin;
		try {
			const res = await fetch(webhook, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Accept: 'application/json',
				},
				body: JSON.stringify({
					...enquiry,
					source: brand.fullName,
					submittedAt: new Date().toISOString(),
					product: product
						? {
								name: product.name,
								reference: product.reference ?? null,
								url: `${origin}/products/${product.slug}`,
							}
						: null,
				}),
				signal: AbortSignal.timeout(10_000),
			});
			if (!res.ok) throw new Error(`Webhook responded ${res.status}`);
			delivered = true;
		} catch (error) {
			console.error('Enquiry delivery failed', error);
		}
	}

	if (!stored && !delivered) {
		return Response.json(
			{ ok: false, reason: 'delivery-failed' },
			{ status: 502 },
		);
	}
	return Response.json({ ok: true });
}
