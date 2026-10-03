import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { PUBLIC_API_URL } from '$env/static/public';
import { dev } from '$app/environment';
import { createServerSupabase } from '$lib/supabase/server';
import { SESSION_COOKIE } from '$lib/session-constants';

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

		const supabase = createServerSupabase(cookies);
		const { data, error } = await supabase.auth.signInWithPassword({ email, password });

		if (error || !data.session) {
			const authErrors: LoginErrors = {
				form: 'Correo o contraseña incorrectos.'
			};
			return fail(401, { errors: authErrors });
		}

		const accessToken = data.session.access_token;

		// Se setea temporalmente solo para validar el rol contra el backend
		// (cookieAuth). Si el usuario no es admin, se elimina y se avisa en el form.
		cookies.set(SESSION_COOKIE, accessToken, {
			path: '/',
			httpOnly: false,
			sameSite: 'lax',
			secure: !dev,
			maxAge: 60 * 60 * 8
		});

		const apiUrl = PUBLIC_API_URL ?? 'http://localhost:8080';
		let isAdmin = false;
		try {
			const res = await fetch(`${apiUrl}/api/admin/auth/verify-role`, {
				headers: { Cookie: `${SESSION_COOKIE}=${accessToken}` }
			});
			if (res.ok) {
				const { role } = (await res.json()) as { role?: string };
				isAdmin = role === 'admin';
			}
		} catch {
			isAdmin = false;
		}

		if (!isAdmin) {
			cookies.delete(SESSION_COOKIE, { path: '/' });
			const forbiddenErrors: LoginErrors = {
				form: 'Correo o contraseña incorrectos.'
			};
			return fail(403, { errors: forbiddenErrors });
		}

		throw redirect(303, '/admin');
	}
};