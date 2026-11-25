import type {
	AdminClient,
	Notification,
	Order,
	OrderItem,
	OrderStatus,
	Product,
	TasaBcv
} from '$lib/types';

/**
 * Datos semilla del panel en modo demo. Viven en el bundle y usan las imágenes
 * locales de `static/`; no hay backend ni Supabase.
 */

export const DEMO_PRODUCTS: Product[] = [
	{
		id: 'yogur-de-fresa-pequeno',
		name: 'Yogur de Fresa Pequeño',
		price: 120,
		description: 'Yogur artesanal de fresa natural, cremoso y fresco. Envase de 0.5 L.',
		category: 'frutal',
		liters: 0.5,
		size: 'pequeño',
		relatedId: 'yogur-de-fresa-grande',
		isAvailable: true,
		image: '/yogurt-fresa.webp'
	},
	{
		id: 'yogur-de-fresa-grande',
		name: 'Yogur de Fresa Grande',
		price: 200,
		description: 'Nuestro clásico de fresa en tamaño familiar. Envase de 1 L.',
		category: 'frutal',
		liters: 1,
		size: 'grande',
		relatedId: 'yogur-de-fresa-pequeno',
		isAvailable: true,
		image: '/yogurt-fresa.webp'
	},
	{
		id: 'yogur-de-mora-pequeno',
		name: 'Yogur de Mora Pequeño',
		price: 130,
		description: 'Mora seleccionada y batida lentamente para un sabor profundo. Envase de 0.5 L.',
		category: 'frutal',
		liters: 0.5,
		size: 'pequeño',
		relatedId: 'yogur-de-mora-grande',
		isAvailable: true,
		image: '/yogurt-mora.webp'
	},
	{
		id: 'yogur-de-mora-grande',
		name: 'Yogur de Mora Grande',
		price: 210,
		description: 'Yogur de mora en presentación grande, con textura extra cremosa. Envase de 1 L.',
		category: 'frutal',
		liters: 1,
		size: 'grande',
		relatedId: 'yogur-de-mora-pequeno',
		isAvailable: true,
		image: '/yogurt-mora.webp'
	},
	{
		id: 'yogur-de-maracuya-pequeno',
		name: 'Yogur de Maracuyá Pequeño',
		price: 140,
		description: 'Maracuyá fresco con el equilibrio justo entre dulce y ácido. Envase de 0.5 L.',
		category: 'especial',
		liters: 0.5,
		size: 'pequeño',
		relatedId: 'yogur-de-maracuya-grande',
		isAvailable: true,
		image: '/yogurt-maracuya.jpg'
	},
	{
		id: 'yogur-de-maracuya-grande',
		name: 'Yogur de Maracuyá Grande',
		price: 220,
		description: 'El toque tropical de la casa en tamaño grande. Envase de 1 L.',
		category: 'especial',
		liters: 1,
		size: 'grande',
		relatedId: 'yogur-de-maracuya-pequeno',
		isAvailable: true,
		image: '/yogurt-maracuya.jpg'
	}
];

export const DEMO_CLIENTS: AdminClient[] = [
	{
		id: 'client-1',
		name: 'Ana',
		lastname: 'García',
		email: 'ana@example.com',
		phone: '+58 412-1111111'
	},
	{
		id: 'client-2',
		name: 'Luis',
		lastname: 'Martínez',
		email: 'luis@example.com',
		phone: '+58 414-2222222'
	},
	{
		id: 'client-3',
		name: 'Carla',
		lastname: 'Rodríguez',
		email: 'carla@example.com',
		phone: '+58 416-3333333'
	}
];

function productById(id: string): Product {
	const product = DEMO_PRODUCTS.find((item) => item.id === id);
	if (!product) throw new Error(`Producto de demo inexistente: ${id}`);
	return product;
}

function itemOf(productId: string, quantity: number): OrderItem {
	const product = productById(productId);
	return {
		productId: product.id,
		name: product.name,
		size: product.size,
		quantity,
		unitPrice: product.price,
		liters: product.liters,
		imageSrc: product.image
	};
}

function makeOrder(
	id: string,
	clientId: string,
	orderStatus: OrderStatus,
	orderDate: string,
	deliveryDate: string,
	items: OrderItem[],
	paymentReceiptImg?: string
): Order {
	return {
		id,
		clientId,
		price: items.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0),
		orderStatus,
		paymentReceiptImg,
		deliveryDate,
		direction: 'Av. Principal, Caracas',
		liters: items.reduce((acc, item) => acc + item.liters * item.quantity, 0),
		orderDate,
		items
	};
}

export const DEMO_ORDERS: Order[] = [
	makeOrder(
		'A-1001',
		'client-1',
		'pendiente',
		'2026-10-24T09:15:00.000Z',
		'2026-10-27',
		[itemOf('yogur-de-fresa-pequeno', 2), itemOf('yogur-de-mora-grande', 1)],
		'/receipt-placeholder.svg'
	),
	makeOrder(
		'A-1002',
		'client-2',
		'comprobada',
		'2026-10-22T15:40:00.000Z',
		'2026-10-26',
		[itemOf('yogur-de-maracuya-grande', 1)],
		'/receipt-placeholder.svg'
	),
	makeOrder(
		'A-1003',
		'client-3',
		'aprobada',
		'2026-10-18T10:00:00.000Z',
		'2026-10-21',
		[itemOf('yogur-de-fresa-grande', 2)]
	),
	makeOrder(
		'A-1004',
		'client-1',
		'entregada',
		'2026-10-02T12:20:00.000Z',
		'2026-10-05',
		[itemOf('yogur-de-mora-pequeno', 1), itemOf('yogur-de-maracuya-pequeno', 2)]
	),
	makeOrder(
		'A-1005',
		'client-3',
		'entregada',
		'2026-09-29T11:10:00.000Z',
		'2026-10-02',
		[itemOf('yogur-de-fresa-grande', 1), itemOf('yogur-de-mora-pequeno', 2)]
	),
	makeOrder(
		'A-1006',
		'client-2',
		'rechazada',
		'2026-09-20T16:45:00.000Z',
		'2026-09-23',
		[itemOf('yogur-de-maracuya-grande', 1)],
		'/receipt-placeholder.svg'
	),
	makeOrder(
		'A-1007',
		'client-1',
		'entregada',
		'2026-09-09T09:30:00.000Z',
		'2026-09-12',
		[itemOf('yogur-de-fresa-pequeno', 2), itemOf('yogur-de-mora-grande', 1)]
	),
	makeOrder(
		'A-1008',
		'client-3',
		'entregada',
		'2026-08-30T10:05:00.000Z',
		'2026-09-02',
		[itemOf('yogur-de-maracuya-pequeno', 3)]
	),
	makeOrder(
		'A-1009',
		'client-1',
		'comprobada',
		'2026-08-20T14:20:00.000Z',
		'2026-08-23',
		[itemOf('yogur-de-mora-pequeno', 2), itemOf('yogur-de-fresa-grande', 1)],
		'/receipt-placeholder.svg'
	),
	makeOrder(
		'A-1010',
		'client-2',
		'entregada',
		'2026-08-09T12:00:00.000Z',
		'2026-08-12',
		[itemOf('yogur-de-fresa-pequeno', 1), itemOf('yogur-de-maracuya-grande', 1)]
	),
	makeOrder(
		'A-1011',
		'client-3',
		'entregada',
		'2026-07-29T09:45:00.000Z',
		'2026-08-01',
		[itemOf('yogur-de-mora-grande', 2)]
	),
	makeOrder(
		'A-1012',
		'client-2',
		'entregada',
		'2026-07-18T17:10:00.000Z',
		'2026-07-21',
		[itemOf('yogur-de-maracuya-pequeno', 2), itemOf('yogur-de-fresa-pequeno', 1)]
	),
	makeOrder(
		'A-1013',
		'client-1',
		'aprobada',
		'2026-07-07T11:35:00.000Z',
		'2026-07-10',
		[itemOf('yogur-de-fresa-grande', 2)],
		'/receipt-placeholder.svg'
	),
	makeOrder(
		'A-1014',
		'client-3',
		'entregada',
		'2026-06-27T15:00:00.000Z',
		'2026-06-30',
		[itemOf('yogur-de-mora-pequeno', 3)]
	),
	makeOrder(
		'A-1015',
		'client-2',
		'entregada',
		'2026-06-16T10:25:00.000Z',
		'2026-06-19',
		[itemOf('yogur-de-maracuya-grande', 1), itemOf('yogur-de-mora-grande', 1)]
	),
	makeOrder(
		'A-1016',
		'client-1',
		'comprobada',
		'2026-06-05T13:40:00.000Z',
		'2026-06-08',
		[itemOf('yogur-de-fresa-pequeno', 2)],
		'/receipt-placeholder.svg'
	),
	makeOrder(
		'A-1017',
		'client-3',
		'entregada',
		'2026-05-22T09:00:00.000Z',
		'2026-05-25',
		[itemOf('yogur-de-fresa-grande', 1), itemOf('yogur-de-maracuya-pequeno', 1)]
	),
	makeOrder(
		'A-1018',
		'client-2',
		'entregada',
		'2026-05-08T12:15:00.000Z',
		'2026-05-11',
		[itemOf('yogur-de-mora-grande', 2)]
	)
];

export const DEMO_NOTIFICATIONS: Notification[] = [
	{
		id: 1,
		description: 'Nuevo pedido #A-1001 de Ana García',
		status: false,
		createdAt: '2026-10-24T09:16:00.000Z'
	},
	{
		id: 2,
		description: 'Ana García subió el comprobante del pedido #A-1001',
		status: false,
		createdAt: '2026-10-24T09:20:00.000Z'
	},
	{
		id: 3,
		description: 'Pedido #A-1003 aprobado',
		status: true,
		createdAt: '2026-10-18T12:00:00.000Z'
	}
];

/** Fallback si DolarAPI no responde; el panel intenta usar la tasa real. */
export const DEMO_TASA: TasaBcv = { tasaBcv: 886.23, dolar: 1 };
