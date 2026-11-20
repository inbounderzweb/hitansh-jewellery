import { NextResponse, type NextRequest } from 'next/server';

/**
 * Admin gate (optimistic). Visitors without a session cookie are sent to
 * the login page before any admin page renders. This only checks that the
 * cookie exists: the session itself is verified on the server by
 * `requireAdmin()` in every admin page and Server Action.
 */
const SESSION_COOKIE = 'hitansh_admin';

export function proxy(request: NextRequest) {
	const { pathname, search } = request.nextUrl;
	const isLogin = pathname === '/admin/login';
	const hasCookie = request.cookies.has(SESSION_COOKIE);

	if (!isLogin && !hasCookie) {
		const url = request.nextUrl.clone();
		url.pathname = '/admin/login';
		url.search = '';
		if (pathname !== '/admin')
			url.searchParams.set('next', pathname + search);
		return NextResponse.redirect(url);
	}

	const response = NextResponse.next();
	response.headers.set('X-Robots-Tag', 'noindex, nofollow');
	response.headers.set('Cache-Control', 'no-store');
	return response;
}

export const config = {
	matcher: ['/admin', '/admin/:path*'],
};
