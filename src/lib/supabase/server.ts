import { createServerClient } from '@supabase/ssr';
import type { Cookies } from '@sveltejs/kit';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_PUBLISHABLE_KEY } from '$env/static/public';

/**
 * Cliente Supabase del lado servidor (SSR). Se crea por request con las
 * cookies de SvelteKit.
 *
 * Se setean con `httpOnly: false` a propósito: la cookie de sesión debe ser
 * legible por el client browser para el guard CSR del panel y el storage.
 * TODO: migrar a HttpOnly cuando el panel valide la sesión contra el backend.
 */
export function createServerSupabase(cookies: Cookies) {
	return createServerClient(
		PUBLIC_SUPABASE_URL,
		PUBLIC_SUPABASE_PUBLISHABLE_KEY,
		{
			cookies: {
				getAll() {
					return cookies.getAll();
				},
				setAll(cookiesToSet) {
					cookiesToSet.forEach(({ name, value, options }) => {
						cookies.set(name, value, { ...options, path: options.path ?? '/', httpOnly: false });
					});
				}
			}
		}
	);
}