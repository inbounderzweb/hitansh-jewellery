/**
 * Enquiry validation shared by the enquiry form (client) and the
 * `/api/enquiry` route handler (server), so both apply the same rules.
 */

export type EnquiryInput = {
	name: string;
	email: string;
	phone: string;
	message: string;
};

export type EnquiryErrors = Partial<Record<keyof EnquiryInput, string>>;

export const ENQUIRY_LIMITS = {
	name: 100,
	email: 254,
	phone: 30,
	message: 2000,
} as const;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_CHARS = /^\+?[\d\s().-]+$/;

export function validateEnquiry(input: EnquiryInput): EnquiryErrors {
	const errors: EnquiryErrors = {};
	const name = input.name.trim();
	const email = input.email.trim();
	const phone = input.phone.trim();
	const message = input.message.trim();

	if (name.length < 2) errors.name = 'Please enter your full name.';
	else if (name.length > ENQUIRY_LIMITS.name)
		errors.name = `Please keep your name under ${ENQUIRY_LIMITS.name} characters.`;

	if (!email) errors.email = 'Please enter your email address.';
	else if (email.length > ENQUIRY_LIMITS.email || !EMAIL.test(email))
		errors.email =
			'Please enter a valid email address, e.g. name@example.com.';

	const digits = phone.replace(/\D/g, '');
	if (!phone) errors.phone = 'Please enter your phone number.';
	else if (
		!PHONE_CHARS.test(phone) ||
		digits.length < 7 ||
		digits.length > 15 ||
		phone.length > ENQUIRY_LIMITS.phone
	)
		errors.phone =
			'Please enter a valid phone number, including the country code.';

	if (message.length > ENQUIRY_LIMITS.message)
		errors.message = `Please keep your message under ${ENQUIRY_LIMITS.message} characters.`;

	return errors;
}

export const normaliseEnquiry = (input: EnquiryInput): EnquiryInput => ({
	name: input.name.trim(),
	email: input.email.trim(),
	phone: input.phone.trim(),
	message: input.message.trim(),
});
