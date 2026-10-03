import { redirect } from '@sveltejs/kit';
import { SESSION_COOKIE } from '$lib/session-constants';

/**
 * Auth del panel (SPA/CSR).
 * El login SSR setea la cookie `jwt` con el access_token de Supabase
 * (`httpOnly: false` para que el guard CSR del panel pueda leerla).
 *
 * TODO: con el backend real, validar la sesión contra un endpoint en lugar de
 * solo verificar la presencia de la cookie.
 */

export function isAdminAuthenticated(): boolean {
	if (typeof document === 'undefined') return false;
	return document.cookie
		.split(';')
		.some((c) => c.trim().startsWith(`${SESSION_COOKIE}=`));
}

/** Lanza redirect a /admin/login si no hay sesión (se usa en load de layouts). */
export function requireAdminAuth(): void {
	if (!isAdminAuthenticated()) {
		throw redirect(307, '/admin/login');
	}
}