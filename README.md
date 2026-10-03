# Yogures Cremosos — Panel admin (SvelteKit)

Panel de administración de "Yogures Cremosos": gestión de productos, pedidos, clientes, notificaciones y tasa BCV. Incluye dashboard con métricas y el indicador de tasa del día (refrescable desde dolarapi).

## Stack

- SvelteKit 5 (SPA/CSR), Tailwind CSS v4, shadcn-svelte
- Supabase (Auth real + Storage) y API propia en Go

## Requisitos

- Node.js compatible (`engine-strict=true`)
- El backend corriendo (repo `yogures-backend`) en `http://localhost:8080`

## Puesta en marcha

```bash
cp .env.example .env   # completar
npm install
npm run dev            # http://localhost:5173
```

Variables de entorno:

- `PUBLIC_API_URL` — URL de la API (default `http://localhost:8080`).
- `PUBLIC_SUPABASE_URL` y `PUBLIC_SUPABASE_PUBLISHABLE_KEY` — proyecto Supabase (auth + storage).

## Verificación

```bash
npm run check      # svelte-check (única verificación)
npm run build
```

## Despliegue

En Vercel: conectar el repo, definir las mismas variables de entorno (apuntando `PUBLIC_API_URL` a la API desplegada). Los orígenes CORS de la API deben incluir el dominio del deploy.

## Probar desde otro dispositivo de la red (LAN)

Por defecto el panel llama a la API en `http://localhost:8080`. Si lo abrís desde otro dispositivo por tu IP privada, ese `localhost` apunta al otro dispositivo y falla. Para probar en LAN:

- En `.env`: `PUBLIC_API_URL=http://<tu-IP-privada>:8080` y reiniciá el dev server.
- En `backend/.env`: `CORS_ORIGIN_ADMIN=http://<tu-IP-privada>:5173` (y `CORS_ORIGIN_CLIENTES` para la tienda).
- Recordá que es HTTP plano en tu red (el JWT viaja en claro) — solo para pruebas locales.

## Enlaces

- API: `yogures-backend`
- Tienda: `yogures-clientes`