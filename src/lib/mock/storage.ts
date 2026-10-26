/**
 * Storage simulado de la demo: no sube archivos a Supabase.
 *
 * Las imágenes chicas se convierten a data URL para que el producto creado o
 * editado conserve la vista previa en localStorage. Si son muy grandes, se usa
 * un placeholder local.
 */
export const PRODUCTS_BUCKET = 'demo';
export const RECEIPTS_BUCKET = 'demo';

const MAX_INLINE_BYTES = 300_000;

export async function uploadProductImage(
	file: File,
	productSlug: string
): Promise<string> {
	void productSlug;

	if (file.size > MAX_INLINE_BYTES) {
		return '/product-placeholder.svg';
	}

	return await new Promise((resolve) => {
		const reader = new FileReader();
		reader.onload = () =>
			resolve(typeof reader.result === 'string' ? reader.result : '/product-placeholder.svg');
		reader.onerror = () => resolve('/product-placeholder.svg');
		reader.readAsDataURL(file);
	});
}

/**
 * Los comprobantes de la demo son rutas locales (`/receipt-placeholder.svg`).
 */
export function receiptPublicUrl(path: string): string {
	if (!path) return '';
	return path.startsWith('/') || path.startsWith('data:') ? path : '/receipt-placeholder.svg';
}
