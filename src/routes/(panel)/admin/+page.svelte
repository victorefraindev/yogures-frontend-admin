<script lang="ts">
	import {
		Boxes,
		ClipboardList,
		Clock,
		FileText,
		HandCoins,
		Users
	} from '@jis3r/icons';
	import { formatBs, formatNumber } from '$lib/format';
	import type { OrderStatus } from '$lib/types';
	import KpiCard from '$lib/components/kpi-card.svelte';
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import OrderStatusBadge from '$lib/components/order-status-badge.svelte';
	import { receiptPublicUrl } from '$lib/supabase/storage';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const totalClients = $derived(data.clients.length);
	const totalOrders = $derived(data.orders.length);
	const pendingOrders = $derived(
		data.orders.filter((o) => o.orderStatus === 'pendiente').length
	);
	const revenue = $derived(
		data.orders
			.filter((o) => ['comprobada', 'aprobada', 'entregada'].includes(o.orderStatus))
			.reduce((acc, o) => acc + o.price, 0)
	);
	const activeProducts = $derived(data.products.filter((p) => p.isAvailable).length);

	const statusColors: Record<OrderStatus, string> = {
		pendiente: '#b794f6',
		comprobada: '#7c3aed',
		aprobada: '#3b82f6',
		entregada: '#f5a623',
		rechazada: '#d9285e'
	};

	const totalPedidosMes = $derived(data.byMonth.reduce((acc, m) => acc + m.pedidos, 0));
	const totalIngresosMes = $derived(data.byMonth.reduce((acc, m) => acc + m.ingresos, 0));
	const totalPedidosDia = $derived(data.byDay.reduce((acc, d) => acc + d.pedidos, 0));

	function capitalize(value: string): string {
		return value.charAt(0).toUpperCase() + value.slice(1);
	}
</script>

<svelte:head>
	<title>Dashboard · Panel de Administración</title>
</svelte:head>

<div class="space-y-6">
	<div>
		<h1 class="flex items-center gap-2.5 font-heading text-2xl font-bold text-foreground">
			<span class="size-2.5 shrink-0 rounded-[3px] bg-brand-gradient"></span>
			Dashboard
		</h1>
		<p class="text-sm text-muted-foreground">
			Vista general del estado de ventas, clientes, pedidos y productos.
		</p>
	</div>

	<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
		<KpiCard title="Clientes" value={totalClients} icon={Users} description="Registrados en la tienda" />
		<KpiCard title="Pedidos" value={totalOrders} icon={ClipboardList} description="Total en el historial" />
		<KpiCard
			title="Pedidos pendientes"
			value={pendingOrders}
			icon={Clock}
			description="A la espera de verificación"
			accent="text-amber-600"
		/>
		<KpiCard
			title="Ingresos confirmados"
			value={formatBs(revenue)}
			icon={HandCoins}
			description="Comprobados + aprobados + entregados"
			accent="text-emerald-600"
		/>
		<KpiCard
			title="Productos activos"
			value={`${activeProducts} / ${data.products.length}`}
			icon={Boxes}
			description="Disponibles en el catálogo"
		/>
	</div>

	<div class="grid gap-6 lg:grid-cols-2">
		<Card class="shadow-sm">
			<CardHeader>
				<CardTitle>Pedidos por mes</CardTitle>
				<CardDescription>Pedidos agrupados por mes.</CardDescription>
			</CardHeader>
			<CardContent>
				<p class="text-3xl font-bold text-foreground">{formatNumber(totalPedidosMes)}</p>
				<p class="mt-0.5 text-xs text-muted-foreground">Pedidos en total</p>
				{#if data.byMonth.length === 0}
					<p class="mt-4 text-sm text-muted-foreground">Sin pedidos registrados.</p>
				{:else}
					<ul class="mt-4 space-y-2">
						{#each data.byMonth as month (month.month)}
							<li class="flex items-center justify-between gap-3">
								<span class="text-sm text-muted-foreground">{month.month}</span>
								<span class="text-sm font-semibold text-foreground">
									{formatNumber(month.pedidos)} pedidos
								</span>
							</li>
						{/each}
					</ul>
				{/if}
			</CardContent>
		</Card>

		<Card class="shadow-sm">
			<CardHeader>
				<CardTitle>Ingresos por mes</CardTitle>
				<CardDescription>Facturación mensual.</CardDescription>
			</CardHeader>
			<CardContent>
				<p class="text-3xl font-bold text-foreground">{formatBs(totalIngresosMes)}</p>
				<p class="mt-0.5 text-xs text-muted-foreground">Ingresos en total</p>
				{#if data.byMonth.length === 0}
					<p class="mt-4 text-sm text-muted-foreground">Sin ingresos registrados.</p>
				{:else}
					<ul class="mt-4 space-y-2">
						{#each data.byMonth as month (month.month)}
							<li class="flex items-center justify-between gap-3">
								<span class="text-sm text-muted-foreground">{month.month}</span>
								<span class="text-sm font-semibold text-foreground">
									{formatBs(month.ingresos)}
								</span>
							</li>
						{/each}
					</ul>
				{/if}
			</CardContent>
		</Card>
	</div>

	<div class="grid gap-6 lg:grid-cols-2">
		<Card class="shadow-sm">
			<CardHeader>
				<CardTitle>Pedidos por día</CardTitle>
				<CardDescription>Pedidos realizados, agrupados por día.</CardDescription>
			</CardHeader>
			<CardContent>
				<p class="text-3xl font-bold text-foreground">{formatNumber(totalPedidosDia)}</p>
				<p class="mt-0.5 text-xs text-muted-foreground">Pedidos en total</p>
				{#if data.byDay.length === 0}
					<p class="mt-4 text-sm text-muted-foreground">Sin pedidos registrados.</p>
				{:else}
					<ul class="mt-4 space-y-2">
						{#each data.byDay as day (day.day)}
							<li class="flex items-center justify-between gap-3">
								<span class="text-sm text-muted-foreground">{day.day}</span>
								<span class="text-sm font-semibold text-foreground">
									{formatNumber(day.pedidos)} pedidos
								</span>
							</li>
						{/each}
					</ul>
				{/if}
			</CardContent>
		</Card>

		<Card class="shadow-sm">
			<CardHeader>
				<CardTitle>Distribución por estado</CardTitle>
				<CardDescription>Pedidos según su estado actual.</CardDescription>
			</CardHeader>
			<CardContent>
				<p class="text-3xl font-bold text-foreground">{formatNumber(totalOrders)}</p>
				<p class="mt-0.5 text-xs text-muted-foreground">Pedidos en total</p>
				{#if data.byStatus.length === 0}
					<p class="mt-4 text-sm text-muted-foreground">Sin pedidos registrados.</p>
				{:else}
					<ul class="mt-4 space-y-2">
						{#each data.byStatus as status (status.status)}
							<li class="flex items-center justify-between gap-3">
								<span class="flex items-center gap-2 text-sm text-muted-foreground">
									<span
										class="size-2.5 shrink-0 rounded-[2px]"
										style="background:{statusColors[status.status]}"
									></span>
									{status.status}
								</span>
								<span class="text-sm font-semibold text-foreground">
									{formatNumber(status.cantidad)}
								</span>
							</li>
						{/each}
					</ul>
				{/if}
			</CardContent>
		</Card>
	</div>

	<div class="grid gap-6 lg:grid-cols-2">
		<Card class="shadow-sm">
			<CardHeader>
				<CardTitle>Yogures más vendidos</CardTitle>
				<CardDescription>Top yogures por unidades vendidas.</CardDescription>
			</CardHeader>
			<CardContent>
				{#if data.topProducts.length === 0}
					<p class="py-8 text-center text-sm text-muted-foreground">
						Sin ventas registradas.
					</p>
				{:else}
					<ul class="space-y-2">
						{#each data.topProducts as product (product.id)}
							<li class="flex items-center justify-between gap-3">
								<span class="truncate text-sm text-muted-foreground">{product.name}</span>
								<span class="text-sm font-semibold text-foreground">
									{formatNumber(product.quantity)} uds
								</span>
							</li>
						{/each}
					</ul>
				{/if}
			</CardContent>
		</Card>

		<Card class="shadow-sm">
			<CardHeader>
				<CardTitle>Categorías más populares</CardTitle>
				<CardDescription>Unidades vendidas por categoría.</CardDescription>
			</CardHeader>
			<CardContent>
				{#if data.topCategories.length === 0}
					<p class="py-8 text-center text-sm text-muted-foreground">
						Sin ventas registradas.
					</p>
				{:else}
					<ul class="space-y-2">
						{#each data.topCategories as category (category.category)}
							<li class="flex items-center justify-between gap-3">
								<span class="text-sm text-muted-foreground">
									{capitalize(category.category)}
								</span>
								<span class="text-sm font-semibold text-foreground">
									{formatNumber(category.quantity)} uds
								</span>
							</li>
						{/each}
					</ul>
				{/if}
			</CardContent>
		</Card>
	</div>

	<div>
		<Card class="shadow-sm">
			<CardHeader>
				<CardTitle>Comprobantes por verificar</CardTitle>
				<CardDescription>
					Pedidos que ya enviaron su comprobante de pago y están pendientes de revisión.
				</CardDescription>
			</CardHeader>
			<CardContent>
				{#if data.pendingPayment.length === 0}
					<p class="py-8 text-center text-sm text-muted-foreground">
						No hay comprobantes por verificar.
					</p>
				{:else}
					<ul class="space-y-3">
						{#each data.pendingPayment as order (order.id)}
							<li class="rounded-xl border border-border bg-muted/40 p-3">
								<div class="flex items-center justify-between gap-2">
									<div class="flex min-w-0 items-center gap-2">
										<FileText class="size-4 shrink-0 text-primary" />
										<span class="truncate text-sm font-semibold text-foreground">
											Pedido #{order.id.slice(0, 8)}
										</span>
									</div>
									<OrderStatusBadge status={order.orderStatus} />
								</div>
								<div class="mt-2 flex items-center justify-between gap-2 text-xs text-muted-foreground">
									<a
										href={receiptPublicUrl(order.paymentReceiptImg ?? '')}
										target="_blank"
										rel="noopener noreferrer"
										class="flex min-w-0 items-center gap-2"
									>
										<img
											src={receiptPublicUrl(order.paymentReceiptImg ?? '')}
											alt="Comprobante"
											class="size-9 shrink-0 rounded-lg border border-border object-cover"
										/>
										<span class="truncate hover:underline">Ver comprobante</span>
									</a>
									<span class="font-semibold text-foreground">{formatBs(order.price)}</span>
								</div>
								<Separator class="my-2.5!" />
								<Button size="sm" variant="outline" href="/admin/pedidos" class="w-full">
									Revisar pedido
								</Button>
							</li>
						{/each}
					</ul>
				{/if}
			</CardContent>
		</Card>
	</div>
</div>