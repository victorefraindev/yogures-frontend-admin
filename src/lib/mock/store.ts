import type {
	AdminClient,
	Notification,
	Order,
	OrderStatus,
	Product,
	ProductPayload,
	TasaBcv
} from '$lib/types';
import {
	DEMO_CLIENTS,
	DEMO_NOTIFICATIONS,
	DEMO_ORDERS,
	DEMO_PRODUCTS,
	DEMO_TASA
} from '$lib/mock/data';

/**
 * Estado mutable del panel en modo demo. Se guarda en localStorage para que
 * los cambios (productos, pedidos, notificaciones) sobrevivan a un refresh.
 */

const STORE_KEY = 'yogures-admin-demo-v1';

interface DemoStore {
	products: Product[];
	clients: AdminClient[];
	orders: Order[];
	notifications: Notification[];
	tasa: TasaBcv;
}

function clone<T>(value: T): T {
	return JSON.parse(JSON.stringify(value)) as T;
}

function seedStore(): DemoStore {
	return {
		products: clone(DEMO_PRODUCTS),
		clients: clone(DEMO_CLIENTS),
		orders: clone(DEMO_ORDERS),
		notifications: clone(DEMO_NOTIFICATIONS),
		tasa: { ...DEMO_TASA }
	};
}

function canUseStorage(): boolean {
	return typeof window !== 'undefined';
}

function readStore(): DemoStore {
	const seed = seedStore();
	if (!canUseStorage()) return seed;

	try {
		const raw = window.localStorage.getItem(STORE_KEY);
		if (!raw) {
			writeStore(seed);
			return seed;
		}
		const parsed = JSON.parse(raw) as Partial<DemoStore>;
		return {
			...seed,
			...parsed,
			tasa: { ...seed.tasa, ...(parsed.tasa ?? {}) }
		};
	} catch {
		return seed;
	}
}

function writeStore(store: DemoStore): void {
	if (!canUseStorage()) return;
	try {
		window.localStorage.setItem(STORE_KEY, JSON.stringify(store));
	} catch {
		// Modo demo: si localStorage está bloqueado, los cambios duran lo que
		// dure la pestaña.
	}
}

function slugify(value: string): string {
	return value
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.toLowerCase()
		.replace(/\s+/g, '-');
}

export function storeGetProducts(): Product[] {
	return clone(readStore().products);
}

export function storeGetProduct(id: string): Product | null {
	const product = readStore().products.find((item) => item.id === id);
	return product ? clone(product) : null;
}

export function storeCreateProduct(payload: ProductPayload): Product {
	const store = readStore();
	let id = slugify(payload.name);
	let suffix = 2;
	while (store.products.some((product) => product.id === id)) {
		id = `${slugify(payload.name)}-${suffix}`;
		suffix += 1;
	}

	const product: Product = {
		id,
		name: payload.name,
		price: payload.price,
		description: payload.description,
		category: payload.category,
		liters: payload.liters,
		size: payload.size,
		relatedId: payload.relatedId || undefined,
		isAvailable: payload.status,
		image: payload.productImg || '/product-placeholder.svg'
	};

	store.products = [product, ...store.products];
	writeStore(store);
	return clone(product);
}

export function storeUpdateProduct(id: string, payload: ProductPayload): void {
	const store = readStore();
	store.products = store.products.map((product) =>
		product.id === id
			? {
					...product,
					name: payload.name,
					price: payload.price,
					description: payload.description,
					category: payload.category,
					liters: payload.liters,
					size: payload.size,
					relatedId: payload.relatedId ?? product.relatedId,
					isAvailable: payload.status,
					image: payload.productImg || product.image
				}
			: product
	);
	writeStore(store);
}

export function storeDeleteProduct(id: string): void {
	const store = readStore();
	store.products = store.products
		.filter((product) => product.id !== id)
		.map((product) =>
			product.relatedId === id ? { ...product, relatedId: undefined } : product
		);
	writeStore(store);
}

export function storeToggleProduct(id: string, isAvailable: boolean): void {
	const store = readStore();
	store.products = store.products.map((product) =>
		product.id === id ? { ...product, isAvailable } : product
	);
	writeStore(store);
}

export function storeRelateProducts(id: string, relatedId: string): void {
	const store = readStore();
	store.products = store.products.map((product) =>
		product.id === id ? { ...product, relatedId: relatedId || undefined } : product
	);
	writeStore(store);
}

export function storeGetClients(): AdminClient[] {
	return clone(readStore().clients);
}

export function storeGetClient(id: string): AdminClient | null {
	const client = readStore().clients.find((item) => item.id === id);
	return client ? clone(client) : null;
}

export function storeGetOrders(): Order[] {
	return clone(readStore().orders).sort((a, b) =>
		b.orderDate.localeCompare(a.orderDate)
	);
}

export function storeGetOrder(id: string): Order | null {
	const order = readStore().orders.find((item) => item.id === id);
	return order ? clone(order) : null;
}

export function storeUpdateOrderStatus(id: string, status: OrderStatus): void {
	const store = readStore();
	store.orders = store.orders.map((order) =>
		order.id === id ? { ...order, orderStatus: status } : order
	);
	writeStore(store);
}

export function storeGetNotifications(): Notification[] {
	return clone(readStore().notifications);
}

export function storeMarkAllNotificationsRead(): void {
	const store = readStore();
	store.notifications = store.notifications.map((notification) => ({
		...notification,
		status: true
	}));
	writeStore(store);
}

export function storeGetTasa(): TasaBcv {
	return { ...readStore().tasa };
}

export function storeRefreshTasa(): { inserted: boolean; message: string } {
	const store = readStore();
	store.tasa = {
		...store.tasa,
		tasaBcv: Math.round((store.tasa.tasaBcv + 0.01) * 100) / 100
	};
	writeStore(store);
	return { inserted: true, message: 'Tasa actualizada (demo)' };
}
