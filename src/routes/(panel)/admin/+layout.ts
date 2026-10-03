import type { LayoutLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { PUBLIC_API_URL } from '$env/static/public';
import { requireAdminAuth } from '$lib/session';
import { SESSION_COOKIE } from '$lib/session-constants';

/**
 * Panel de administración: SPA + CSR.
 * `ssr = false` desactiva el renderizado en servidor; los datos se cargan en el
 * cliente. El guard valida la cookie y, si el backend responde, también el rol
 * del usuario (GET /api/admin/auth/verify-role).
 */
export const ssr = false;
export const csr = true;

const API_URL = PUBLIC_API_URL ?? 'http://localhost:8080';

function clearSession(): void {
	document.cookie = `${SESSION_COOKIE}=; path=/; max-age=0`;
}

export const load: LayoutLoad = async () => {
	requireAdminAuth();

	const res = await fetch(`${API_URL}/api/admin/auth/verify-role`, {
		credentials: 'include'
	}).catch(() => null);

	// Backend caído o error de servidor: dejar pasar (las llamadas de datos fallarán solas).
	if (!res) return {};

	// Sesión inválida o rol incorrecto: limpiar la cookie antes de redirigir,
	// para no caer en el bucle /admin ↔ /admin/login (que SvelteKit corta con 500).
	if (res.status === 401 || res.status === 403) {
		clearSession();
		throw redirect(307, '/admin/login?error=forbidden');
	}

	if (!res.ok) return {};

	const { role } = (await res.json()) as { role?: string };
	if (role !== 'admin') {
		clearSession();
		throw redirect(307, '/admin/login?error=forbidden');
	}

	return {};
};