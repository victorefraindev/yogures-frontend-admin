import { redirect } from '@sveltejs/kit';
import { SESSION_COOKIE } from '$lib/session-constants';

/**
 * Auth del panel en modo demo.
 * El login SSR setea la cookie `jwt` con una marca local (no un JWT real).
 * No hay backend ni Supabase que validar.
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
