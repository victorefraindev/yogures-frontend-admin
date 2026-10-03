<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { Bell } from '@jis3r/icons';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import { getNotifications } from '$lib/api';
	import { markAllNotificationsRead } from '$lib/client-api';
	import type { Notification } from '$lib/types';

	const NOTIFICATIONS_POLL_MS = 30_000;

	let notifications = $state<Notification[]>([]);
	let open = $state(false);
	let loading = $state(true);

	const unread = $derived(notifications.filter((n) => !n.status).length);

	let pollTimer: ReturnType<typeof setInterval> | undefined;

	function onFocusRefresh() {
		void refresh();
	}

	onMount(() => {
		void refresh();
		pollTimer = setInterval(() => void refresh(), NOTIFICATIONS_POLL_MS);
		window.addEventListener('focus', onFocusRefresh);
	});

	onDestroy(() => {
		if (pollTimer) clearInterval(pollTimer);
		window.removeEventListener('focus', onFocusRefresh);
	});

	// Al abrir el panel se marcan todas como leídas (limpia el badge).
	$effect(() => {
		if (open) {
			void markAll();
		}
	});

	async function refresh() {
		if (open) return;
		if (notifications.length === 0) loading = true;
		notifications = await getNotifications();
		loading = false;
	}

	async function markAll() {
		const res = await markAllNotificationsRead();
		if (res.ok) {
			notifications = notifications.map((n) => ({ ...n, status: true }));
		}
	}

	function formatDate(iso: string): string {
		try {
			return new Date(iso).toLocaleString('es-VE', {
				day: '2-digit',
				month: 'short',
				hour: '2-digit',
				minute: '2-digit'
			});
		} catch {
			return iso;
		}
	}
</script>

<Sheet.Root bind:open>
	<Sheet.Trigger child={triggerChild} />

	<Sheet.Content side="right" class="w-full sm:max-w-sm">
		<Sheet.Header>
			<Sheet.Title class="flex items-center gap-2 text-lg">
				<Bell class="size-5 text-primary" />
				Notificaciones
			</Sheet.Title>
		</Sheet.Header>

		{#if notifications.length === 0}
			<div
				class="flex flex-1 items-center justify-center px-6 py-12 text-center text-sm text-muted-foreground"
			>
				{loading ? 'Cargando…' : 'Sin notificaciones por ahora.'}
			</div>
		{:else}
			<div class="flex flex-1 flex-col gap-2 overflow-y-auto px-4">
				{#each notifications as n (n.id)}
					<div
						class={n.status
							? 'rounded-xl bg-muted/50 p-3'
							: 'rounded-xl border border-primary/30 bg-primary/5 p-3'}
					>
						<p class="text-sm font-medium text-foreground">{n.description}</p>
						<p class="mt-0.5 text-xs text-muted-foreground">{formatDate(n.createdAt)}</p>
					</div>
				{/each}
			</div>

			<div class="p-4">
				<Separator class="mb-4" />
				<Button
					variant="outline"
					class="w-full"
					disabled={unread === 0}
					onclick={markAll}
				>
					Marcar todas como leídas
				</Button>
			</div>
		{/if}
	</Sheet.Content>
</Sheet.Root>

{#snippet triggerChild({ props }: { props: Record<string, unknown> })}
	<Button
		{...props}
		variant="ghost"
		size="icon"
		class="relative"
		aria-label={unread > 0 ? `Notificaciones, ${unread} sin leer` : 'Notificaciones'}
	>
		<Bell class="size-5" />
		{#if unread > 0}
			<span
				class="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground"
			>
				{unread}
			</span>
		{/if}
	</Button>
{/snippet}