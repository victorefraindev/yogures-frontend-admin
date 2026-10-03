import type { PageLoad } from './$types';
import { getTasaBcv, getTasaBcvHistory, getTasaEnUso } from '$lib/api';
import { isAdminAuthenticated } from '$lib/session';

export const load: PageLoad = async () => {
	if (!isAdminAuthenticated()) {
		return {
			tasa: { tasaBcv: 0, dolar: 1 },
			tasaEnUso: { tasaBcv: 0, dolar: 1 },
			history: []
		};
	}

	const [tasa, tasaEnUso, history] = await Promise.all([
		getTasaBcv(),
		getTasaEnUso(),
		getTasaBcvHistory()
	]);
	return { tasa, tasaEnUso, history };
};