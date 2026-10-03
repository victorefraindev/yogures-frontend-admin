/**
 * Constantes de sesión del panel admin.
 * El login (SSR) obtiene la sesión de Supabase y setea la cookie `jwt` con el
 * `access_token`; el panel (CSR) la lee para el guard y el backend la recibe
 * en cada request.
 */

export const SESSION_COOKIE = 'jwt';