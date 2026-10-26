<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import {
		ChartColumn,
		ClipboardList,
		LayoutDashboard,
		LogOut,
		Boxes,
		ShieldCheck,
		Users
	} from '@jis3r/icons';
	import { SESSION_COOKIE } from '$lib/session-constants';
	import { cn } from '$lib/utils.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import { Toaster } from '$lib/components/ui/sonner/index.js';
	import NotificationsBell from '$lib/components/NotificationsBell.svelte';
	import {
		Sidebar,
		SidebarContent,
		SidebarFooter,
		SidebarGroup,
		SidebarGroupContent,
		SidebarGroupLabel,
		SidebarHeader,
		SidebarInset,
		SidebarMenu,
		SidebarMenuButton,
		SidebarMenuItem,
		SidebarProvider,
		SidebarRail,
		SidebarTrigger
	} from '$lib/components/ui/sidebar/index.js';

	let { children } = $props();

	const nav = [
		{ href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
		{ href: '/admin/pedidos', label: 'Pedidos', icon: ClipboardList },
		{ href: '/admin/clientes', label: 'Clientes', icon: Users },
		{ href: '/admin/productos', label: 'Productos', icon: Boxes },
		{ href: '/admin/tasa-bcv', label: 'Tasa BCV', icon: ChartColumn }
	];

	const currentPath = $derived(page.url.pathname);

	function isActive(href: string): boolean {
		if (href === '/admin') return currentPath === '/admin';
		return currentPath.startsWith(href);
	}

	function logout() {
		document.cookie = `${SESSION_COOKIE}=; path=/; max-age=0`;
		goto('/admin/login');
	}
</script>

<SidebarProvider>
	<Sidebar collapsible="icon">
		<SidebarHeader>
			<div class="flex items-center gap-2 px-2 py-1">
				<span
					class="flex size-9 shrink-0 items-center justify-center rounded-xl bg-brand-gradient text-white"
				>
					<ShieldCheck class="size-5" />
				</span>
				<div class="grid flex-1 text-left leading-tight">
					<span class="truncate font-heading text-sm font-bold text-sidebar-foreground">
						Yogures Cremosos
					</span>
					<span class="truncate text-xs text-muted-foreground">Panel admin · Demo</span>
				</div>
			</div>
		</SidebarHeader>

		<SidebarContent>
			<SidebarGroup>
				<SidebarGroupLabel>Administración</SidebarGroupLabel>
				<SidebarGroupContent>
<SidebarMenu class="gap-1.5 md:gap-1">
					{#each nav as item (item.href)}
							{#snippet buttonChild({ props }: { props: Record<string, unknown> })}
								<a
									href={item.href}
									{...props}
									class={cn(
										props.class as string,
										'transition-all duration-200 group-hover/menu-item:translate-x-1 group-hover/menu-item:text-primary'
									)}
								>
									<item.icon
										class="transition-transform duration-200 group-hover/menu-item:scale-110"
									/>
									<span>{item.label}</span>
								</a>
							{/snippet}
<SidebarMenuItem
								class="cursor-pointer rounded-lg transition-colors duration-200 hover:bg-primary/15"
							>
<SidebarMenuButton
								isActive={isActive(item.href)}
								tooltipContent={item.label}
								class="text-[18px] h-10 data-active:bg-brand-gradient data-active:text-white"
								child={buttonChild}
							/>
							</SidebarMenuItem>
						{/each}
					</SidebarMenu>
				</SidebarGroupContent>
			</SidebarGroup>
		</SidebarContent>

		<SidebarFooter>
			<div class="flex flex-col gap-2 p-2">
				<Separator />
				<Button
					variant="ghost"
					class="justify-start gap-2 text-sidebar-foreground transition-all duration-200 hover:translate-x-1 hover:bg-primary/10 hover:text-primary"
					onclick={logout}
				>
					<LogOut class="size-4" />
					<span>Cerrar sesión</span>
				</Button>
			</div>
		</SidebarFooter>
		<SidebarRail />
	</Sidebar>

	<SidebarInset>
		<header
			class="flex h-14 shrink-0 items-center gap-2 border-b border-border bg-background/80 px-4 backdrop-blur-sm"
		>
			<SidebarTrigger class="-ml-1" />
			<Separator orientation="vertical" class="mr-2 h-4!" />
			<div class="flex items-center gap-2">
				<span class="hidden text-sm font-semibold text-foreground sm:inline">
					Panel de Administración
				</span>
				<Badge variant="secondary" class="hidden md:inline-flex">
					{nav.find((n) => isActive(n.href))?.label ?? 'Dashboard'}
				</Badge>
			</div>

			<div class="ml-auto">
				<NotificationsBell />
			</div>
		</header>

		<main class="flex-1 p-4 md:p-6">
			{@render children()}
		</main>
	</SidebarInset>
</SidebarProvider>

<Toaster richColors position="top-right" />