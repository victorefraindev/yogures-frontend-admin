import { fail, redirect } from '@sveltejs/kit';
import { dev } from '$app/environment';
import { SESSION_COOKIE } from '$lib/session-constants';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ cookies }) => {
	if (cookies.get(SESSION_COOKIE)) {
		throw redirect(307, '/admin');
	}
	return {};
};

type LoginErrors = Partial<Record<'email' | 'password' | 'form', string>>;

export const actions: Actions = {
	default: async ({ cookies, request }) => {
		const formData = await request.formData();
		const email = String(formData.get('email') ?? '').trim();
		const password = String(formData.get('password') ?? '');

		const errors: LoginErrors = {};
		if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
			errors.email = 'Ingresá un correo válido';
		}
		if (!password) {
			errors.password = 'Ingresá tu contraseña';
		}
		if (Object.keys(errors).length) {
			return fail(400, { errors });
		}

		// Modo demo: cualquier correo y contraseña abren el panel. La cookie es
		// una marca local, no un JWT.
		cookies.set(SESSION_COOKIE, 'demo-admin-session', {
			path: '/',
			httpOnly: false,
			sameSite: 'lax',
			secure: !dev,
			maxAge: 60 * 60 * 8
		});

		throw redirect(303, '/admin');
	}
};
