# Arquitectura (C4 Model)

## Nivel 1 — Contexto
El sistema permite a clientes de una Pet Shop navegar productos, gestionar su carrito y realizar pedidos. Se integra con servicios de autenticación y un proveedor de deployment.

**Actores:**
- Cliente
- Administrador (futuro)

**Sistemas externos:**
- Proveedor de Auth (Supabase/Auth0)
- Plataforma de deploy (Render/Railway)

## Nivel 2 — Contenedores
- **Frontend (Next.js 15)**: UI, navegación, consumo de API
- **Backend (NestJS)**: API REST, lógica de negocio
- **PostgreSQL**: datos de productos, usuarios, órdenes
- **Redis**: sesiones/caché

## Nivel 3 — Componentes (detallado)
### Frontend (Next.js)
- **App Router / Pages**: rutas principales (home, catálogo, detalle, carrito, checkout, órdenes).
- **UI Components**: componentes reutilizables (cards, grids, headers, forms).
- **State/Context**: estado global mínimo (carrito, sesión).
- **API Client (Fetch)**: consumo de endpoints REST del backend.

**Relación:** UI → State/Context → API Client → Backend.

### Backend (NestJS)
- **Auth Module**: integración con Supabase/Auth0, sesión/usuario.
- **Catalog Module**: productos, categorías, búsqueda.
- **Cart Module**: carrito, persistencia y validaciones.
- **Orders Module**: creación de órdenes e historial.
- **Search Module**: soporte a full-text search en PostgreSQL.
- **Users Module**: perfil mínimo (si aplica).

**Infraestructura interna:**
- **Prisma Layer**: acceso a PostgreSQL.
- **Redis Cache**: caché de catálogo y sesiones.
- **Validation Layer**: Zod para DTOs.
- **Logging**: Pino/Winston.

**Relación:** Controllers → Services → Prisma/Redis.

### Data Stores
- **PostgreSQL**: productos, usuarios, carritos, órdenes.
- **Redis**: sesiones y caché.

## Flujos principales
1. **Auth:** Cliente → Frontend → Auth Provider → Backend
2. **Compra:** Cliente → Frontend → Backend → DB/Redis
3. **Búsqueda:** Cliente → Frontend → Backend → PostgreSQL FTS
