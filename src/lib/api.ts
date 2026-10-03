import { PUBLIC_API_URL } from '$env/static/public';
import type {
	AdminClient,
	BackendExchangeRate,
	BackendNotification,
	BackendOrder,
	BackendOrderDetail,
	BackendProduct,
	BackendUser,
	Notification,
	Order,
	OrderItem,
	OrderStatus,
	OrdersByDay,
	OrdersByMonth,
	OrdersByStatus,
	Product,
	TasaBcv,
	TopCategory,
	TopProduct
} from '$lib/types';

/**
 * Capa de datos del panel (se ejecuta en el cliente, CSR/SPA).
 * Llama a la API del backend con la cookie de sesión (`credentials: "include"`).
 */

const API_URL = PUBLIC_API_URL ?? 'http://localhost:8080';

async function apiGet<T>(path: string): Promise<T | null> {
	try {
		const res = await fetch(`${API_URL}${path}`, {
			credentials: 'include'
		});
		if (!res.ok) return null;
		return (await res.json()) as T;
	} catch {
		return null;
	}
}

function toAdminClient(raw: BackendUser): AdminClient {
	return {
		id: raw.id,
		name: raw.name,
		lastname: raw.lastname,
		email: raw.email,
		phone: raw.phone
	};
}

export async function getClients(): Promise<AdminClient[]> {
	const raw = await apiGet<BackendUser[]>('/api/admin/users');
	return raw ? raw.map(toAdminClient) : [];
}

export async function getClient(userId: string): Promise<AdminClient | null> {
	const raw = await apiGet<BackendUser>(`/api/admin/client/${userId}`);
	return raw ? toAdminClient(raw) : null;
}

/** Notificaciones del admin (GET /api/admin/notifications). */
export async function getNotifications(): Promise<Notification[]> {
	const raw = await apiGet<BackendNotification[]>('/api/admin/notifications');
	return raw
		? raw.map((n) => ({
				id: n.id,
				description: n.description,
				status: n.status,
				createdAt: n.created_at
			}))
		: [];
}

const KNOWN_STATUSES: OrderStatus[] = [
	'pendiente',
	'comprobada',
	'aprobada',
	'entregada',
	'rechazada'
];

function normalizeStatus(status: string): OrderStatus {
	return KNOWN_STATUSES.includes(status as OrderStatus)
		? (status as OrderStatus)
		: 'pendiente';
}

function toOrder(raw: BackendOrder, items: OrderItem[]): Order {
	const price = items.reduce((acc, i) => acc + i.unitPrice * i.quantity, 0);
	const liters = items.reduce((acc, i) => acc + i.liters * i.quantity, 0);
	return {
		id: raw.id,
		clientId: raw.user_id,
		price,
		orderStatus: normalizeStatus(raw.status),
		paymentReceiptImg: raw.receipt_img || undefined,
		deliveryDate: raw.delivery_date || undefined,
		direction: raw.direction || undefined,
		liters,
		orderDate: raw.created_at,
		items
	};
}

async function fetchOrderItems(orderId: string, products: Product[]): Promise<OrderItem[]> {
	const details = await apiGet<BackendOrderDetail[]>(
		`/api/admin/orders/${orderId}/details`
	);
	if (!details) return [];

	return details.map((d) => {
		const product = products.find((p) => p.id === d.product_id);
		return {
			productId: d.product_id,
			name: product?.name ?? 'Yogur',
			size: d.size === 'grande' ? 'grande' : 'pequeño',
			quantity: d.quantity,
			unitPrice: d.quantity > 0 ? d.price / d.quantity : d.price,
			liters: d.liters,
			imageSrc: product?.image
		};
	});
}

/** Pedidos de un cliente específico (GET /api/admin/orders filtrado). */
export async function getClientOrders(userId: string): Promise<Order[]> {
	const orders = await getOrders();
	return orders.filter((o) => o.clientId === userId);
}

export async function getOrders(): Promise<Order[]> {
	const products = await getProducts();
	const raw = await apiGet<BackendOrder[]>('/api/admin/orders');
	if (!raw) return [];

	const orders: Order[] = [];
	for (const order of raw) {
		const items = await fetchOrderItems(order.id, products);
		orders.push(toOrder(order, items));
	}
	return orders.sort((a, b) => b.orderDate.localeCompare(a.orderDate));
}

export async function getOrder(id: string): Promise<Order | null> {
	const raw = await apiGet<BackendOrder>(`/api/admin/orders/${id}`);
	if (!raw) return null;
	const products = await getProducts();
	const items = await fetchOrderItems(id, products);
	return toOrder(raw, items);
}

/** Pedidos que ya cuentan con comprobante de pago (a verificar). */
export async function getOrdersAwaitingPayment(): Promise<Order[]> {
	const orders = await getOrders();
	return orders.filter((o) => o.orderStatus === 'pendiente' && o.paymentReceiptImg);
}

function toProduct(raw: BackendProduct): Product {
	return {
		id: raw.id,
		name: raw.name,
		price: raw.price,
		description: raw.description,
		category: raw.category,
		liters: raw.liters,
		size: raw.size === 'grande' ? 'grande' : 'pequeño',
		relatedId: raw.relatedId && raw.relatedId !== 'null' ? raw.relatedId : undefined,
		isAvailable: raw.status,
		image: raw.productImg || undefined
	};
}

export async function getProducts(): Promise<Product[]> {
	const raw = await apiGet<BackendProduct[]>('/api/products');
	return raw ? raw.map(toProduct) : [];
}

export async function getProduct(id: string): Promise<Product | null> {
	const products = await getProducts();
	return products.find((p) => p.id === id) ?? null;
}

export async function getTasaBcv(): Promise<TasaBcv> {
	const raw = await apiGet<BackendExchangeRate[]>('/exchange-rate');
	const first = Array.isArray(raw) ? raw[0] : undefined;
	if (!first) return { tasaBcv: 0, dolar: 1 };
	return { tasaBcv: first.exchange_rate_bcv, dolar: 1 };
}

/** Tasa que la tienda usa para fijar precios (no hay endpoint propio). */
export async function getTasaEnUso(): Promise<TasaBcv> {
	return getTasaBcv();
}

/** Histórico de la tasa BCV (sin endpoint en el backend: vacío por ahora). */
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
export function getTopCategories(orders: Order[], products: Product[], limit = 6): TopCategory[] {
	const categoryById = new Map(products.map((p) => [p.id, p.category]));
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