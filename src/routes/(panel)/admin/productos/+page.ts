import type { PageLoad } from './$types';
import { getProducts, getTasaBcv } from '$lib/api';
import { isAdminAuthenticated } from '$lib/session';

export const load: PageLoad = async () => {
	if (!isAdminAuthenticated()) {
		return { products: [], tasaBcv: 0 };
	}

	const [products, tasa] = await Promise.all([getProducts(), getTasaBcv()]);
	return { products, tasaBcv: tasa.tasaBcv };
};