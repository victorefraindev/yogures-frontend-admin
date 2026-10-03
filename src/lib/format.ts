/** Precio en bolívares formateado (Bs). */
export function formatBs(value: number): string {
	return new Intl.NumberFormat('es-VE', {
		style: 'currency',
		currency: 'VES',
		maximumFractionDigits: 2
	}).format(value);
}

/** Equivalente en dólares formateado (≈ $X.XX). */
export function formatUsd(value: number): string {
	return new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: 'USD',
		maximumFractionDigits: 2
	}).format(value);
}

/** Número con miles, sin moneda (ej. tasa BCV). */
export function formatNumber(value: number): string {
	return new Intl.NumberFormat('es-VE', { maximumFractionDigits: 2 }).format(value);
}

/** Número compacto para ejes (ej. 5,6 k). */
export function formatCompact(value: number): string {
	return new Intl.NumberFormat('es-VE', {
		notation: 'compact',
		maximumFractionDigits: 1
	}).format(value);
}

/** Fecha a DD/MM/YYYY, aceptando ISO (`2025-05-01T…`) o ya formateada. */
export function formatDate(value: string): string {
	if (!value) return '—';
	if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) return value;
	const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
	if (match) return `${match[3]}/${match[2]}/${match[1]}`;
	return value;
}