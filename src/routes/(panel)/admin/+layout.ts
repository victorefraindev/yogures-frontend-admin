import type { LayoutLoad } from './$types';
import { requireAdminAuth } from '$lib/session';

/**
 * Panel de administración: SPA + CSR.
 * `ssr = false` desactiva el renderizado en servidor; el guard solo verifica
 * la cookie local de la demo (no hay backend que validar).
 */
export const ssr = false;
export const csr = true;

export const load: LayoutLoad = async () => {
	requireAdminAuth();
	return {};
};
