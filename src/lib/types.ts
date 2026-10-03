/**
 * Tipos del panel de administrador. Reflejan los schemas de
 * `openapi/admin-openapi.yml` y el contrato real del backend Go.
 */

/** Credenciales de login del admin (Supabase Auth, email + password). */
export interface AdminLoginPayload {
	email: string;
	password: string;
}

/** Cliente según `GET /api/admin/users` (sin dirección en el backend). */
export interface AdminClient {
	id: string;
	name: string;
	lastname: string;
	email: string;
	phone: string;
}

/** Tamaños disponibles para un producto. */
export type ProductSize = 'pequeño' | 'grande';

/** Estado de una orden (string, según el backend). */
export type OrderStatus =
	| 'pendiente'
	| 'comprobada'
	| 'aprobada'
	| 'entregada'
	| 'rechazada';

/** Línea de detalle de una orden. */
export interface OrderItem {
	productId: string;
	name: string;
	size: ProductSize;
	quantity: number;
	unitPrice: number;
	liters: number;
	imageSrc?: string;
}

/** Orden según el frontend (derivada de `Order` backend + details). */
export interface Order {
	id: string;
	clientId: string;
	price: number;
	orderStatus: OrderStatus;
	paymentReceiptImg?: string;
	deliveryDate?: string;
	direction?: string;
	liters: number;
	orderDate: string;
	items: OrderItem[];
}

/** Producto según `GET /api/products` + `isAvailable`/`image` del frontend. */
export interface Product {
	id: string;
	name: string;
	/** Precio único (en bolívares). El backend expone un solo `price`. */
	price: number;
	description: string;
	category: string;
	liters: number;
	/** Tamaño de la variante (pequeño/grande). Obligatorio desde la creación. */
	size: ProductSize;
	/** Id del yogur hermano del mismo sabor (variante del otro tamaño). */
	relatedId?: string;
	isAvailable: boolean;
	image?: string;
}

/** Payload para crear/editar producto (POST/PUT /api/admin/product). */
export interface ProductPayload {
	name: string;
	price: number;
	description: string;
	category: string;
	liters: number;
	size: ProductSize;
	relatedId?: string;
	productImg: string;
	status: boolean;
}

/** Tasa BCV según `GET /exchange-rate` (mapeado a `tasaBcv`/`dolar`). */
export interface TasaBcv {
	tasaBcv: number;
	dolar: number;
}

/** Resultado genérico de las mutaciones del backend. */
export interface ApiResult<T = { message: string }> {
	ok: boolean;
	status: number;
	data?: T;
	error?: string;
}

/** Pedidos agrupados por mes para los charts del dashboard. */
export interface OrdersByMonth {
	month: string;
	pedidos: number;
	ingresos: number;
}

/** Pedidos agrupados por día para el histograma del dashboard. */
export interface OrdersByDay {
	day: string;
	pedidos: number;
}

/** Yogur más vendido (top) para el dashboard. */
export interface TopProduct {
	id: string;
	name: string;
	quantity: number;
}

/** Categoría más popular (top) para el dashboard. */
export interface TopCategory {
	category: string;
	quantity: number;
}

/** Distribución de pedidos por estado. */
export interface OrdersByStatus {
	status: OrderStatus;
	cantidad: number;
}

/** Notificación del panel (GET /api/admin/notifications). */
export interface Notification {
	id: number;
	description: string;
	/** `true` = leída. */
	status: boolean;
	createdAt: string;
}

/* ---------- Tipos crudos del backend (contrato Go) ---------- */

export interface BackendUser {
	id: string;
	name: string;
	lastname: string;
	email: string;
	phone: string;
	role: string;
}

export interface BackendProduct {
	id: string;
	name: string;
	price: number;
	description: string;
	category: string;
	liters: number;
	size: string;
	relatedId: string;
	productImg: string;
	status: boolean;
}

export interface BackendOrder {
	id: string;
	user_id: string;
	status: string;
	direction: string;
	receipt_img: string;
	delivery_date: string;
	created_at: string;
}

export interface BackendOrderDetail {
	product_id: string;
	order_id: string;
	price: number;
	liters: number;
	size: string;
	quantity: number;
}

export interface BackendExchangeRate {
	id: string;
	exchange_rate_bcv: number;
	created_at: string;
}

export interface BackendNotification {
	id: number;
	description: string;
	user_id: string;
	status: boolean;
	created_at: string;
}