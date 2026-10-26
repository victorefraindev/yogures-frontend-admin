import type {
	AdminClient,
	Notification,
	Order,
	OrdersByDay,
	OrdersByMonth,
	OrdersByStatus,
	Product,
	TasaBcv,
	TopCategory,
	TopProduct
} from '$lib/types';
import {
	storeGetClient,
	storeGetClients,
	storeGetNotifications,
	storeGetOrder,
	storeGetOrders,
	storeGetProducts,
	storeGetTasa
} from '$lib/mock/store';

/**
 * Capa de datos del panel en modo demo. Todo sale del estado local; no hay
 * fetch al backend ni a Supabase.
 */

export async function getClients(): Promise<AdminClient[]> {
	return storeGetClients();
}

export async function getClient(userId: string): Promise<AdminClient | null> {
	return storeGetClient(userId);
}

/** Notificaciones del admin. */
export async function getNotifications(): Promise<Notification[]> {
	return storeGetNotifications();
}

/** Pedidos de un cliente específico. */
export async function getClientOrders(userId: string): Promise<Order[]> {
	const orders = await getOrders();
	return orders.filter((order) => order.clientId === userId);
}

export async function getOrders(): Promise<Order[]> {
	return storeGetOrders();
}

export async function getOrder(id: string): Promise<Order | null> {
	return storeGetOrder(id);
}

/** Pedidos que ya cuentan con comprobante de pago (a verificar). */
export async function getOrdersAwaitingPayment(): Promise<Order[]> {
	const orders = await getOrders();
	return orders.filter(
		(order) => order.orderStatus === 'pendiente' && order.paymentReceiptImg
	);
}

export async function getProducts(): Promise<Product[]> {
	return storeGetProducts();
}

export async function getProduct(id: string): Promise<Product | null> {
	const products = await getProducts();
	return products.find((product) => product.id === id) ?? null;
}

export async function getTasaBcv(): Promise<TasaBcv> {
	return storeGetTasa();
}

/** Tasa que la tienda usa para fijar precios (en demo es la misma). */
export async function getTasaEnUso(): Promise<TasaBcv> {
	return storeGetTasa();
}

/** Histórico de la tasa BCV (la demo no guarda histórico). */
export async function getTasaBcvHistory(): Promise<{ date: string; tasa: number }[]> {
	return [];
}

/** Pedidos por mes para los charts del dashboard. */
export async function getOrdersByMonth(): Promise<OrdersByMonth[]> {
	const orders = await getOrders();
	const grouped = new Map<string, OrdersByMonth>();
	for (const order of orders) {
		const { month, year } = parseOrderDate(order.orderDate);
		const key = `${month}/${year}`;
		const label = `${MONTHS[month - 1]} ${year}`;
		const current = grouped.get(key) ?? { month: label, pedidos: 0, ingresos: 0 };
		current.pedidos += 1;
		current.ingresos += order.price;
		grouped.set(key, current);
	}
	return [...grouped.values()].sort((a, b) => a.month.localeCompare(b.month));
}

/** Distribución de pedidos por estado. */
export async function getOrdersByStatus(): Promise<OrdersByStatus[]> {
	const orders = await getOrders();
	const grouped = new Map<string, OrdersByStatus>();
	for (const order of orders) {
		const current = grouped.get(order.orderStatus) ?? {
			status: order.orderStatus,
			cantidad: 0
		};
		current.cantidad += 1;
		grouped.set(order.orderStatus, current);
	}
	return [...grouped.values()];
}

/** Pedidos por día (histograma). `day` en formato DD/MM, ordenado ascendente. */
export function getOrdersByDay(orders: Order[]): OrdersByDay[] {
	const grouped = new Map<string, { iso: string; pedidos: number }>();
	for (const order of orders) {
		const iso = order.orderDate.slice(0, 10);
		if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) continue;
		const current = grouped.get(iso) ?? { iso, pedidos: 0 };
		current.pedidos += 1;
		grouped.set(iso, current);
	}
	return [...grouped.values()]
		.sort((a, b) => a.iso.localeCompare(b.iso))
		.map(({ iso, pedidos }) => ({
			day: `${iso.slice(8, 10)}/${iso.slice(5, 7)}`,
			pedidos
		}));
}

/** Yogures más vendidos por unidades (top N). */
export function getTopProducts(orders: Order[], limit = 5): TopProduct[] {
	const counts = new Map<string, TopProduct>();
	for (const order of orders) {
		for (const item of order.items) {
			const current = counts.get(item.productId) ?? {
				id: item.productId,
				name: item.name,
				quantity: 0
			};
			current.quantity += item.quantity;
			counts.set(item.productId, current);
		}
	}
	return [...counts.values()].sort((a, b) => b.quantity - a.quantity).slice(0, limit);
}

/** Categorías más populares por unidades (top N). */
export function getTopCategories(
	orders: Order[],
	products: Product[],
	limit = 6
): TopCategory[] {
	const categoryById = new Map(products.map((product) => [product.id, product.category]));
	const counts = new Map<string, number>();
	for (const order of orders) {
		for (const item of order.items) {
			const category = categoryById.get(item.productId) ?? 'Otros';
			counts.set(category, (counts.get(category) ?? 0) + item.quantity);
		}
	}
	return [...counts.entries()]
		.map(([category, quantity]) => ({ category, quantity }))
		.sort((a, b) => b.quantity - a.quantity)
		.slice(0, limit);
}

const MONTHS = [
	'Ene',
	'Feb',
	'Mar',
	'Abr',
	'May',
	'Jun',
	'Jul',
	'Ago',
	'Sep',
	'Oct',
	'Nov',
	'Dic'
];

/** Extrae mes/año de `created_at` (ISO) o del formato DD/MM/YYYY. */
function parseOrderDate(date: string): { month: number; year: number } {
	const iso = /^(\d{4})-(\d{2})/.exec(date);
	if (iso) {
		return { year: Number(iso[1]), month: Number(iso[2]) };
	}
	const parts = date.split('/');
	return {
		month: Number(parts[1]),
		year: Number(parts[2])
	};
}
