import { PUBLIC_API_URL } from '$env/static/public';
import type {
	ApiResult,
	OrderStatus,
	ProductPayload
} from '$lib/types';

/**
 * Mutaciones del lado cliente (panel CSR/SPA). Llaman al backend con la cookie
 * de sesión `jwt` (`credentials: "include"`).
 */

const API_URL = PUBLIC_API_URL ?? 'http://localhost:8080';

async function apiFetch<T = { message: string }>(
	path: string,
	options: RequestInit
): Promise<ApiResult<T>> {
	try {
		const res = await fetch(`${API_URL}${path}`, {
			credentials: 'include',
			...options,
			headers: {
				'Content-Type': 'application/json',
				...(options.headers ?? {})
			}
		});

		let data: unknown = null;
		try {
			data = await res.json();
		} catch {
			// cuerpo vacío
		}

		if (!res.ok) {
			const err =
				(data as { error?: string })?.error ??
				(data as { message?: string })?.message ??
				'Error de conexión con el servidor';
			return { ok: false, status: res.status, error: err };
		}

		return { ok: true, status: res.status, data: data as T };
	} catch {
		return {
			ok: false,
			status: 0,
			error: 'No se pudo conectar con el servidor. Intenta más tarde.'
		};
	}
}

/** Cambia el estado de un pedido (PATCH /api/admin/orders/:orderId/status). */
export async function updateOrderStatus(
	orderId: string,
	status: OrderStatus
): Promise<ApiResult> {
	if (!orderId) {
		return { ok: false, status: 400, error: 'Falta el identificador del pedido' };
	}
	return apiFetch(`/api/admin/orders/${orderId}/status`, {
		method: 'PATCH',
		body: JSON.stringify({ status })
	});
}

/** Crea un producto (POST /api/admin/product). */
export async function createProduct(payload: ProductPayload): Promise<ApiResult> {
	if (!payload.name || payload.price <= 0) {
		return {
			ok: false,
			status: 400,
			error: 'Fallo al crear el producto, se mandaron campos erróneos'
		};
	}
	return apiFetch('/api/admin/product', {
		method: 'POST',
		body: JSON.stringify(payload)
	});
}

/** Edita un producto (PUT /api/admin/product/:productId). */
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
	return apiFetch(`/api/admin/product/${productId}`, {
		method: 'PUT',
		body: JSON.stringify(payload)
	});
}

/** Relaciona dos yogures del mismo sabor (PATCH /api/admin/product/relatedProducts). */
export async function relateProducts(
	productId: string,
	relatedId: string
): Promise<ApiResult> {
	if (!productId) {
		return { ok: false, status: 400, error: 'Falta el identificador del producto' };
	}
	return apiFetch('/api/admin/product/relatedProducts', {
		method: 'PATCH',
		body: JSON.stringify({ id: productId, related_id: relatedId })
	});
}

/** Activa/desactiva un producto (PATCH /api/admin/product/:productId/status). */
export async function toggleProduct(
	productId: string,
	isAvailable: boolean
): Promise<ApiResult> {
	if (!productId) {
		return { ok: false, status: 400, error: 'Falta el identificador del producto' };
	}
	return apiFetch(`/api/admin/product/${productId}/status`, {
		method: 'PATCH',
		body: JSON.stringify({ status: isAvailable })
	});
}

/** Elimina un producto (DELETE /api/admin/product/:productId). */
export async function deleteProduct(productId: string): Promise<ApiResult> {
	if (!productId) {
		return { ok: false, status: 400, error: 'Falta el identificador del producto' };
	}
	return apiFetch(`/api/admin/product/${productId}`, {
		method: 'DELETE'
	});
}

/** Marca todas las notificaciones del admin como leídas (PUT /api/admin/notifications). */
export async function markAllNotificationsRead(): Promise<ApiResult> {
	return apiFetch('/api/admin/notifications', { method: 'PUT' });
}

/** Fuerza el refresco de la tasa BCV desde dolarapi (POST /api/admin/exchange-rate). */
export async function refreshTasaBcv(): Promise<ApiResult<{ inserted: boolean; message: string }>> {
	return apiFetch('/api/admin/exchange-rate', { method: 'POST' });
}