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
const DOLAR_API_URL = 'https://ve.dolarapi.com/v1/dolares/oficial';
const TASA_CACHE_MS = 6 * 60 * 60 * 1000;

let lastTasaFetch = 0;
let tasaRequest: Promise<TasaBcv> | null = null;

interface DolarApiResponse {
	promedio?: number;
	fechaActualizacion?: string;
}

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

async function fetchTasaFromApi(): Promise<TasaBcv> {
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), 8000);

	let response: Response;
	try {
		response = await fetch(DOLAR_API_URL, {
			cache: 'no-store',
			signal: controller.signal
		});
	} finally {
		clearTimeout(timeout);
	}

	if (!response.ok) {
		throw new Error(`DolarAPI respondió ${response.status}`);
	}

	const data = (await response.json()) as DolarApiResponse;
	const value = Number(data.promedio);
	if (!Number.isFinite(value) || value <= 0) {
		throw new Error('DolarAPI devolvió una tasa inválida');
	}

	const store = readStore();
	store.tasa = { tasaBcv: value, dolar: 1 };
	writeStore(store);
	lastTasaFetch = Date.now();
	return { ...store.tasa };
}

/**
 * Devuelve la tasa oficial. La primera vez consulta DolarAPI y después
 * reutiliza el valor durante 6 h (igual que el backend real).
 */
export async function loadTasaBcv(force = false): Promise<TasaBcv> {
	if (!force && lastTasaFetch > 0 && Date.now() - lastTasaFetch < TASA_CACHE_MS) {
		return storeGetTasa();
	}

	if (tasaRequest) return tasaRequest;

	tasaRequest = fetchTasaFromApi()
		.catch(() => storeGetTasa())
		.finally(() => {
			tasaRequest = null;
		});

	return tasaRequest;
}

/** Fuerza la consulta a DolarAPI; si falla, propaga el error a la UI. */
export async function storeRefreshTasa(): Promise<{ inserted: boolean; message: string }> {
	const before = storeGetTasa().tasaBcv;
	const next = await fetchTasaFromApi();
	const inserted = next.tasaBcv !== before;
	return {
		inserted,
		message: inserted ? 'Tasa actualizada desde DolarAPI' : 'La tasa ya está actualizada'
	};
}
