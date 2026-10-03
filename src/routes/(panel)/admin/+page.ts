import type { PageLoad } from './$types';
import {
	getClients,
	getOrders,
	getOrdersAwaitingPayment,
	getOrdersByDay,
	getOrdersByMonth,
	getOrdersByStatus,
	getProducts,
	getTasaBcv,
	getTopCategories,
	getTopProducts
} from '$lib/api';
import { isAdminAuthenticated } from '$lib/session';

export const load: PageLoad = async () => {
	// Sin sesión el layout ya redirige a /admin/login; no hacemos requests.
	if (!isAdminAuthenticated()) {
		return {
			clients: [],
			orders: [],
			products: [],
			tasaBcv: { tasaBcv: 0, dolar: 1 },
			byMonth: [],
			byDay: [],
			byStatus: [],
			pendingPayment: [],
			topProducts: [],
			topCategories: []
		};
	}

	const [clients, orders, products, tasaBcv, byMonth, byStatus, pendingPayment] =
		await Promise.all([
			getClients(),
			getOrders(),
			getProducts(),
			getTasaBcv(),
			getOrdersByMonth(),
			getOrdersByStatus(),
			getOrdersAwaitingPayment()
		]);

	return {
		clients,
		orders,
		products,
		tasaBcv,
		byMonth,
		byDay: getOrdersByDay(orders),
		byStatus,
		pendingPayment,
		topProducts: getTopProducts(orders),
		topCategories: getTopCategories(orders, products)
	};
};