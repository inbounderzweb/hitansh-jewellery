import { getProduct } from '@/lib/catalogue';
import { brand } from '@/content/site';
import {
	normaliseEnquiry,
	validateEnquiry,
	type EnquiryInput,
} from '@/lib/enquiry';

/**
 * POST /api/enquiry — product booking / enquiry requests.
 *
 * Delivery: the validated enquiry is forwarded as JSON to
 * `ENQUIRY_WEBHOOK_URL` (a Formspree / Zapier / Make / CRM / Slack-workflow
 * endpoint of the client's choosing). When no webhook is configured the
 * route answers 503 `not-configured` and the form falls back to opening the
 * visitor's email app addressed to `contact.email` — the site's existing
 * enquiry channel — so no enquiry is ever silently dropped.
 */

const str = (value: unknown) => (typeof value === 'string' ? value : '');

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

	// Product details come from the catalogue, never from the client.
	const product = body.product ? getProduct(str(body.product)) : undefined;

	const webhook = process.env.ENQUIRY_WEBHOOK_URL;
	if (!webhook) {
		return Response.json(
			{ ok: false, reason: 'not-configured' },
			{ status: 503 },
		);
	}

	const origin = new URL(request.url).origin;
	const payload = {
		...normaliseEnquiry(input),
		source: brand.fullName,
		submittedAt: new Date().toISOString(),
		product: product
			? {
					name: product.name,
					reference: product.reference ?? null,
					gemstone: product.gemstone,
					metal: product.metal,
					url: `${origin}/products/${product.slug}`,
				}
			: null,
	};

	try {
		const res = await fetch(webhook, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Accept: 'application/json',
			},
			body: JSON.stringify(payload),
			signal: AbortSignal.timeout(10_000),
		});
		if (!res.ok) throw new Error(`Webhook responded ${res.status}`);
	} catch (error) {
		console.error('Enquiry delivery failed', error);
		return Response.json(
			{ ok: false, reason: 'delivery-failed' },
			{ status: 502 },
		);
	}

	return Response.json({ ok: true });
}
