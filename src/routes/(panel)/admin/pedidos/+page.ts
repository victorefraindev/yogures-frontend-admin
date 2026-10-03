import type { PageLoad } from './$types';
import { getClients, getClient, getOrders } from '$lib/api';
import type { AdminClient } from '$lib/types';
import { isAdminAuthenticated } from '$lib/session';

export const load: PageLoad = async () => {
	if (!isAdminAuthenticated()) {
		return { orders: [], clients: [] };
	}

	const [orders, clients] = await Promise.all([getOrders(), getClients()]);

	// Resuelve los clientes que no aparecen en /api/admin/users (filtro role='client')
	// usando GET /api/admin/client/:userId, que no filtra por rol.
	const missingIds = [
		...new Set(
			orders
				.map((o) => o.clientId)
				.filter((id) => id && !clients.some((c) => c.id === id))
		)
	];
	const extra = (
		await Promise.all(
			missingIds.map(async (id) => {
				const raw = await getClient(id);
				return raw ? { ...raw, id } : null;
			})
		)
	).filter((c): c is AdminClient => c !== null);

	return { orders, clients: [...clients, ...extra] };
};