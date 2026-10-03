import type { PageLoad } from './$types';
import { getClients, getOrders } from '$lib/api';
import { isAdminAuthenticated } from '$lib/session';

export const load: PageLoad = async () => {
	if (!isAdminAuthenticated()) {
		return { clients: [], orders: [] };
	}

	const [clients, orders] = await Promise.all([getClients(), getOrders()]);
	return { clients, orders };
};