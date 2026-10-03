import { supabase } from '$lib/supabase/client';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';

/**
 * Upload de imágenes de yogures a Supabase Storage y URLs públicas de los
 * comprobantes de pago (bucket público `payment_receipt`).
 */
export const PRODUCTS_BUCKET = 'yogurts';
export const RECEIPTS_BUCKET = 'payment_receipt';

/**
 * Sube una imagen de producto y devuelve su URL pública.
 */
export async function uploadProductImage(file: File, productSlug: string): Promise<string> {
	const extension = file.name.split('.').pop() ?? 'jpg';
	const path = `${productSlug}-${Date.now()}.${extension}`;

	const { data, error } = await supabase.storage
		.from(PRODUCTS_BUCKET)
		.upload(path, file, { upsert: true });

	if (error) {
		throw new Error(error.message);
	}

	const { data: publicUrlData } = supabase.storage.from(PRODUCTS_BUCKET).getPublicUrl(data.path);
	return publicUrlData.publicUrl;
}

/**
 * URL pública de un comprobante de pago a partir de su `receipt_img`.
 * El bucket `payment_receipt` es público.
 */
export function receiptPublicUrl(path: string): string {
	if (!path) return '';
	return `${PUBLIC_SUPABASE_URL}/storage/v1/object/public/${RECEIPTS_BUCKET}/${path}`;
}