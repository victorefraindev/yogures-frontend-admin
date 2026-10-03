<script lang="ts">
	import {
		CalendarDays,
		ClipboardList,
		HandCoins,
		Route,
		Search,
		Users
	} from '@jis3r/icons';
	import { formatBs, formatDate } from '$lib/format';
	import type { AdminClient, Order } from '$lib/types';
	import OrderStatusBadge from '$lib/components/order-status-badge.svelte';
	import KpiCard from '$lib/components/kpi-card.svelte';
	import { Avatar, AvatarFallback } from '$lib/components/ui/avatar/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card/index.js';
	import {
		Dialog,
		DialogContent,
		DialogDescription,
		DialogFooter,
		DialogHeader,
		DialogTitle
	} from '$lib/components/ui/dialog/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import {
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow
	} from '$lib/components/ui/table/index.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const PAGE_SIZE = 20;

	let selectedClient = $state<AdminClient | null>(null);
	let searchQuery = $state('');
	let visibleCount = $state(PAGE_SIZE);

	$effect(() => {
		searchQuery;
		visibleCount = PAGE_SIZE;
	});

	const clients = $derived(
		[...data.clients].sort((a, b) =>
			`${a.name} ${a.lastname}`.localeCompare(`${b.name} ${b.lastname}`, 'es')
		)
	);

	const ordersByClient = $derived.by(() => {
		const map = new Map<string, Order[]>();
		for (const order of data.orders) {
			const list = map.get(order.clientId) ?? [];
			list.push(order);
			map.set(order.clientId, list);
		}
		return map;
	});

	function clientOrders(clientId: string): Order[] {
		return ordersByClient.get(clientId) ?? [];
	}

	function orderCount(clientId: string): number {
		return clientOrders(clientId).length;
	}

function totalSpent(clientId: string): number {
	return clientOrders(clientId).reduce((acc, order) => acc + order.price, 0);
}

function lastOrderDate(clientId: string): string {
	const orders = clientOrders(clientId);
	if (orders.length === 0) return '';
	return orders.reduce((latest, order) =>
		order.orderDate > latest ? order.orderDate : latest
	, orders[0].orderDate);
}

function lastOrderDirection(clientId: string): string {
	return clientOrders(clientId)[0]?.direction ?? '';
}

	function initials(client: AdminClient): string {
		return `${client.name.trim().charAt(0)}${client.lastname.trim().charAt(0)}`.toUpperCase();
	}

	const totalOrders = $derived(data.orders.length);
	const clientsWithOrders = $derived(new Set(data.orders.map((o) => o.clientId)).size);
	const totalRevenue = $derived(data.orders.reduce((acc, order) => acc + order.price, 0));

	const filteredClients = $derived(
		clients.filter((client) => {
			const q = searchQuery.trim().toLowerCase();
			if (!q) return true;
			return `${client.name} ${client.lastname} ${client.email} ${client.phone}`
				.toLowerCase()
				.includes(q);
		})
	);
</script>

<svelte:head>
	<title>Clientes · Panel de Administración</title>
</svelte:head>

<div class="space-y-6">
	<div class="flex items-end justify-between gap-4">
		<div>
			<h1 class="flex items-center gap-2.5 font-heading text-2xl font-bold text-foreground">
				<span class="size-2.5 shrink-0 rounded-[3px] bg-brand-gradient"></span>
				Clientes
			</h1>
			<p class="text-sm text-muted-foreground">
				Todos los clientes registrados y sus pedidos.
			</p>
		</div>
		<Badge variant="secondary">{data.clients.length} clientes</Badge>
	</div>

	<div class="grid gap-4 sm:grid-cols-3">
		<KpiCard
			title="Clientes"
			value={data.clients.length}
			icon={Users}
			description="Registrados en la tienda"
		/>
		<KpiCard
			title="Pedidos"
			value={totalOrders}
			icon={ClipboardList}
			description={`${clientsWithOrders} clientes con pedidos`}
		/>
		<KpiCard
			title="Ingresos"
			value={formatBs(totalRevenue)}
			icon={HandCoins}
			description="Suma de todos los pedidos"
		/>
	</div>

	<div class="relative">
		<Search
			class="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
		/>
		<Input
			type="search"
			placeholder="Buscar por nombre, correo o teléfono…"
			class="pl-8"
			bind:value={searchQuery}
		/>
	</div>

	<Card class="shadow-sm">
		<CardHeader>
			<CardTitle>Lista de clientes</CardTitle>
			<CardDescription>
				Hacé clic en un cliente para ver su perfil y sus pedidos.
			</CardDescription>
		</CardHeader>
		<CardContent>
			{#if filteredClients.length === 0}
				<div class="py-10 text-center">
					{#if data.clients.length === 0}
						<p class="text-sm text-muted-foreground">
							Todavía no hay clientes registrados.
						</p>
					{:else}
						<p class="text-sm text-muted-foreground">
							Ningún cliente coincide con la búsqueda.
						</p>
					{/if}
				</div>
			{:else}
				<div class="overflow-x-auto">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Cliente</TableHead>
								<TableHead>Teléfono</TableHead>
								<TableHead class="text-center">Pedidos</TableHead>
								<TableHead>Último pedido</TableHead>
								<TableHead class="text-right">Total gastado</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{#each filteredClients.slice(0, visibleCount) as client (client.id)}
								<TableRow
									class="cursor-pointer"
									onclick={() => (selectedClient = client)}
								>
									<TableCell>
										<div class="flex items-center gap-3">
											<Avatar>
												<AvatarFallback
													class="bg-brand-gradient text-xs font-semibold text-white"
												>
													{initials(client)}
												</AvatarFallback>
											</Avatar>
											<div class="min-w-0">
												<p class="truncate text-sm font-semibold text-foreground">
													{client.name} {client.lastname}
												</p>
												<p class="truncate text-xs text-muted-foreground">
													{client.email}
												</p>
											</div>
										</div>
									</TableCell>
									<TableCell>{client.phone}</TableCell>
									<TableCell class="text-center">
										<Badge variant="secondary">{orderCount(client.id)}</Badge>
									</TableCell>
									<TableCell>{formatDate(lastOrderDate(client.id))}</TableCell>
									<TableCell class="text-right font-semibold text-primary">
										{formatBs(totalSpent(client.id))}
									</TableCell>
								</TableRow>
							{/each}
						</TableBody>
					</Table>
				</div>

				{#if visibleCount < filteredClients.length}
					<div class="mt-4 flex flex-col items-center gap-2">
						<p class="text-xs text-muted-foreground">
							Mostrando {visibleCount} de {filteredClients.length} clientes
						</p>
						<Button variant="outline" onclick={() => (visibleCount += PAGE_SIZE)}>
							Ver más
						</Button>
					</div>
				{/if}
			{/if}
		</CardContent>
	</Card>

	<Dialog
		open={selectedClient !== null}
		onOpenChange={(open) => {
			if (!open) selectedClient = null;
		}}
	>
		{#if selectedClient}
			{@const client = selectedClient}
			{@const orders = clientOrders(client.id)}
			{@const spent = totalSpent(client.id)}
			{@const lastOrder = lastOrderDate(client.id)}
			<DialogContent class="max-h-[90dvh] overflow-y-auto sm:max-w-[calc(100vw-2rem)] lg:max-w-3xl">
				<DialogHeader>
					<DialogTitle class="flex flex-wrap items-center gap-2 text-lg">
						<Avatar>
							<AvatarFallback
								class="bg-brand-gradient text-sm font-semibold text-white"
							>
								{initials(client)}
							</AvatarFallback>
						</Avatar>
						{client.name} {client.lastname}
					</DialogTitle>
					<DialogDescription>Perfil del cliente y sus pedidos.</DialogDescription>
				</DialogHeader>

				<div class="grid gap-4 sm:grid-cols-2">
					<div class="space-y-4">
						<div class="rounded-xl border border-border p-3">
							<p class="text-xs font-semibold text-foreground">Datos de contacto</p>
							<div class="mt-2 space-y-1 text-sm">
								<p class="truncate text-foreground">{client.email}</p>
								<p class="truncate text-muted-foreground">{client.phone}</p>
							</div>
						</div>

						<div class="grid grid-cols-2 gap-2">
							<div class="rounded-xl border border-border bg-muted/40 p-3">
								<ClipboardList class="size-4 text-primary" />
								<p class="mt-1.5 text-xs text-muted-foreground">Pedidos</p>
								<p class="text-sm font-semibold text-foreground">{orders.length}</p>
							</div>
							<div class="rounded-xl border border-border bg-muted/40 p-3">
								<CalendarDays class="size-4 text-primary" />
								<p class="mt-1.5 text-xs text-muted-foreground">Último</p>
								<p class="text-sm font-semibold text-foreground">
									{formatDate(lastOrder)}
								</p>
							</div>
						</div>

						<div class="rounded-xl border border-border bg-muted/40 p-3">
							<p class="flex items-center gap-1.5 text-xs font-semibold text-foreground">
								<Route class="size-3.5 text-primary" />
								Dirección de entrega
							</p>
							<p class="mt-1 text-sm text-foreground">
								{lastOrderDirection(client.id) || 'Sin dirección registrada'}
							</p>
						</div>
					</div>

					<div>
						<p
							class="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
						>
							Historial de pedidos ({orders.length})
						</p>
						{#if orders.length === 0}
							<p class="py-6 text-center text-sm text-muted-foreground">
								Este cliente todavía no hizo pedidos.
							</p>
						{:else}
							<div class="max-h-[340px] overflow-y-auto rounded-xl border border-border">
								<ul class="divide-y divide-border">
									{#each orders as order (order.id)}
										<li class="flex items-center justify-between gap-3 px-3 py-2.5">
											<div class="min-w-0">
												<p class="truncate text-sm font-semibold text-foreground">
													#{order.id.slice(0, 8)}
												</p>
												<p class="text-xs text-muted-foreground">
													{formatDate(order.orderDate)}
												</p>
											</div>
											<div class="flex shrink-0 items-center gap-2">
												<OrderStatusBadge status={order.orderStatus} />
												<span class="text-sm font-semibold text-primary">
													{formatBs(order.price)}
												</span>
											</div>
										</li>
									{/each}
								</ul>
							</div>
						{/if}
					</div>
				</div>

				<Separator />

				<div class="flex items-center justify-between">
					<p class="text-sm text-muted-foreground">Total acumulado</p>
					<p class="font-heading text-2xl font-bold text-primary">
						{formatBs(spent)}
					</p>
				</div>

				<DialogFooter>
					<Button variant="outline" class="w-full" onclick={() => (selectedClient = null)}>
						Cerrar
					</Button>
				</DialogFooter>
			</DialogContent>
		{/if}
	</Dialog>
</div>