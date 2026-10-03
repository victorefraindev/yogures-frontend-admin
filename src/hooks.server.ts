import { dev } from '$app/environment';

/**
 * Security headers para todo el panel. La CSP y HSTS se aplican solo en
 * producción: en dev, Vite/SvelteKit usan scripts inline y HMR (ws), que una
 * CSP estricta bloquearía.
 */
export async function handle({ event, resolve }) {
	const response = await resolve(event);

	response.headers.set('X-Content-Type-Options', 'nosniff');
	response.headers.set('X-Frame-Options', 'DENY');
	response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
	response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

	if (!dev) {
		response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
		response.headers.set(
			'Content-Security-Policy',
			[
				"default-src 'self'",
				"script-src 'self' 'unsafe-inline'",
				"style-src 'self' 'unsafe-inline'",
				"img-src 'self' data: https://*.supabase.co blob:",
				"font-src 'self' data:",
				"connect-src 'self' http://localhost:8080 https: wss:",
				"frame-ancestors 'none'",
				"base-uri 'self'",
				"form-action 'self'"
			].join('; ')
		);
	}

	return response;
}