import { createBrowserClient } from '@supabase/ssr';
import { SESSION_COOKIE } from '$lib/session-constants';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_PUBLISHABLE_KEY } from '$env/static/public';

/**
 * Cliente Supabase del lado browser (CSR/SPA).
 *
 * Se usa para el storage (upload de imágenes) y el signOut desde el panel.
 * Además sincroniza el `access_token` de la sesión en la cookie `jwt` para que
 * el backend la reciba en cada request (cookieAuth). El token se refresca solo
 * y la cookie se limpia al cerrar sesión.
 */

export const supabase = createBrowserClient(
	PUBLIC_SUPABASE_URL,
	PUBLIC_SUPABASE_PUBLISHABLE_KEY
);

const JWT_MAX_AGE = 60 * 60 * 8;
const SECURE = import.meta.env.PROD ? '; Secure' : '';

supabase.auth.onAuthStateChange((event, session) => {
	if (event === 'SIGNED_OUT') {
		document.cookie = `${SESSION_COOKIE}=; path=/; max-age=0`;
		return;
	}
	if (session?.access_token) {
		document.cookie = `${SESSION_COOKIE}=${session.access_token}; path=/; max-age=${JWT_MAX_AGE}; sameSite=lax${SECURE}`;
	}
});