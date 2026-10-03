<script lang="ts">
	import type { OrderStatus } from '$lib/types';
	import { Badge, type BadgeVariant } from '$lib/components/ui/badge/index.js';

	const statusVariant: Record<OrderStatus, BadgeVariant> = {
		aprobada: 'default',
		comprobada: 'secondary',
		entregada: 'default',
		pendiente: 'outline',
		rechazada: 'destructive'
	};

	const statusLabel: Record<OrderStatus, string> = {
		pendiente: 'Pendiente',
		comprobada: 'Comprobada',
		aprobada: 'Aprobada',
		entregada: 'Entregada',
		rechazada: 'Rechazada'
	};

	let { status }: { status: OrderStatus } = $props();
</script>

<Badge variant={statusVariant[status]}>{statusLabel[status]}</Badge>