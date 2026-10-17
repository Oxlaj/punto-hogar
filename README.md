<div align="center">
  <img src="/public/images/logo.png" alt="ConejoMalo" width="80" />
  
  # ConejoMalo
  **E-commerce minimalista para productos de conejos**

  Stack: Next.js (App Router) · TypeScript · Tailwind CSS · Prisma · PostgreSQL · JWT Auth
</div>

## Tabla de Contenidos
1. [Características](#características)
2. [Arquitectura Resumida](#arquitectura-resumida)
3. [Instalación Rápida](#instalación-rápida)
4. [Scripts Principales](#scripts-principales)
5. [Modelo de Datos](#modelo-de-datos)
6. [API](#api)
7. [Autenticación & Carrito](#autenticación--carrito)
8. [Despliegue](#despliegue)
9. [Manual técnico](#manual-técnico)
10. [Roadmap](#roadmap)
11. [Licencia](#licencia)

## Características
- Catálogo de productos y categorías.
- Carrito persistido en cookie (visitantes pueden ordenar sin registrarse).
- Creación de órdenes con validaciones básicas.
- Búsqueda instantánea (debounce) con precios.
- Autenticación simple via JWT (login, registro, logout, estado de sesión).
- UI responsive con navbar adaptable y dropdown.
- Paneles API para administración (productos, categorías, usuarios) listo para endurecer.

## Arquitectura Resumida
Ver documento detallado en `docs/arquitectura.md`.

```
UI (App Router + Client Components)
  | fetch /api/*
  v
API Routes (server)
  | Prisma Client
  v
PostgreSQL
```

Decisiones clave: carrito en cookie JSON, eventos custom (`cart:updated`, `auth:changed`), JWT manual con `jose`.

## Instalación Rápida
Requisitos: Node 18+, PostgreSQL.
```bash
git clone <repo>
cd next-app
npm install
cp .env.example .env   # editar DATABASE_URL y JWT_SECRET
npx prisma migrate dev --name init
npm run db:seed
npm run dev
```
Abrir http://localhost:3000

## Scripts Principales
| Script | Acción |
|--------|--------|
| dev | Inicia servidor desarrollo |
| build | Compila producción |
| start | Sirve build |
| prisma:migrate | Migraciones dev |
| prisma:generate | Regenerar cliente Prisma |
| prisma:studio | UI DB |
| db:seed | Ejecutar semillas |

## Modelo de Datos
Resumen (ver `prisma/schema.prisma`):
| Entidad | Campos clave | Relaciones |
|---------|--------------|-----------|
| User | id, email, role | orders, products |
| Category | id, name, slug | products |
| Product | id, name, slug, price, imageUrl | category, orderItems |
| Order | id, customer, total | items, user? |
| OrderItem | id, quantity, unitPrice | order, product |

## API
Referencia completa en `docs/api.md`. Ejemplo rápido:
```bash
curl /api/search?q=heno
curl -X POST -H 'Content-Type: application/json' \
  -d '{"productId":"<ID>","qty":2}' /api/cart
```

## Autenticación & Carrito
Detalles en `docs/auth-cart.md`.
- Cookie `session` (httpOnly) + JWT HS256.
- Cookie `cart` (no httpOnly) con items.
- Flujo de orden crea Order y limpia carrito.

## Despliegue
Guía en `docs/despliegue.md` (Vercel, DO App Platform, Docker Compose, checklist prod).

## Manual técnico
Ver `docs/manual-tecnico.md`.

## Roadmap
- [ ] Persistir carrito en DB para usuarios.
- [ ] Middleware/guard para rutas admin.
- [ ] Integrar pasarela de pagos (Stripe).
- [ ] Optimización imágenes (`next/image`).
- [ ] Tests unitarios y e2e (Playwright / Vitest).
- [ ] Observabilidad (logging estructurado y métricas).

## Licencia
MIT © 2025

---
Documentos adicionales:
- `docs/arquitectura.md`
- `docs/api.md`
- `docs/auth-cart.md`
- `docs/despliegue.md`
- `docs/manual-tecnico.md`
