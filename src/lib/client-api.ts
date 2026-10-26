import type { ApiResult, OrderStatus, ProductPayload } from '$lib/types';
import {
	storeCreateProduct,
	storeDeleteProduct,
	storeMarkAllNotificationsRead,
	storeRefreshTasa,
	storeRelateProducts,
	storeToggleProduct,
	storeUpdateOrderStatus,
	storeUpdateProduct
} from '$lib/mock/store';

/**
 * Mutaciones del panel en modo demo. Actualizan localStorage y devuelven la
 * misma forma `ApiResult` que usaban los componentes.
 */

function ok<T = { message: string }>(data: T): ApiResult<T> {
	return { ok: true, status: 200, data };
}

/** Cambia el estado de un pedido. */
export async function updateOrderStatus(
	orderId: string,
	status: OrderStatus
): Promise<ApiResult> {
	if (!orderId) {
		return { ok: false, status: 400, error: 'Falta el identificador del pedido' };
	}
	storeUpdateOrderStatus(orderId, status);
	return ok({ message: 'Estado del pedido actualizado (demo)' });
}

/** Crea un producto. */
export async function createProduct(payload: ProductPayload): Promise<ApiResult> {
	if (!payload.name || payload.price <= 0) {
		return {
			ok: false,
			status: 400,
			error: 'Fallo al crear el producto, se mandaron campos erróneos'
		};
	}
	storeCreateProduct(payload);
	return ok({ message: 'Producto creado (demo)' });
}

/** Edita un producto. */
export async function updateProduct(
	productId: string,
	payload: ProductPayload
): Promise<ApiResult> {
	if (!productId || !payload.name) {
		return {
			ok: false,
			status: 400,
			error: 'Fallo al editar el producto, se mandaron campos erróneos'
		};
	}
	storeUpdateProduct(productId, payload);
	return ok({ message: 'Producto actualizado (demo)' });
}

/** Relaciona dos yogures del mismo sabor. */
export async function relateProducts(
	productId: string,
	relatedId: string
): Promise<ApiResult> {
	if (!productId) {
		return { ok: false, status: 400, error: 'Falta el identificador del producto' };
	}
	storeRelateProducts(productId, relatedId);
	return ok({ message: 'Productos relacionados (demo)' });
}

/** Activa/desactiva un producto. */
export async function toggleProduct(
	productId: string,
	isAvailable: boolean
): Promise<ApiResult> {
	if (!productId) {
		return { ok: false, status: 400, error: 'Falta el identificador del producto' };
	}
	storeToggleProduct(productId, isAvailable);
	return ok({ message: 'Disponibilidad actualizada (demo)' });
}

/** Elimina un producto. */
export async function deleteProduct(productId: string): Promise<ApiResult> {
	if (!productId) {
		return { ok: false, status: 400, error: 'Falta el identificador del producto' };
	}
	storeDeleteProduct(productId);
	return ok({ message: 'Producto eliminado (demo)' });
}

/** Marca todas las notificaciones del admin como leídas. */
export async function markAllNotificationsRead(): Promise<ApiResult> {
	storeMarkAllNotificationsRead();
	return ok({ message: 'Notificaciones marcadas como leídas (demo)' });
}

/** Simula el refresco de la tasa BCV. */
export async function refreshTasaBcv(): Promise<
	ApiResult<{ inserted: boolean; message: string }>
> {
	return ok(storeRefreshTasa());
}
