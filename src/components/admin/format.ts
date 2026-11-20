/** Admin dates use one fixed zone so server and browser render alike. */
const timeZone = process.env.NEXT_PUBLIC_ADMIN_TIMEZONE || 'UTC';

const dateFormat = new Intl.DateTimeFormat('en-GB', {
	day: 'numeric',
	month: 'short',
	year: 'numeric',
	timeZone,
});

const dateTimeFormat = new Intl.DateTimeFormat('en-GB', {
	day: 'numeric',
	month: 'short',
	year: 'numeric',
	hour: '2-digit',
	minute: '2-digit',
	timeZone,
});

export const formatDate = (iso: string) => dateFormat.format(new Date(iso));
export const formatDateTime = (iso: string) =>
	dateTimeFormat.format(new Date(iso));
