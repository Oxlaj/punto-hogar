# Plan de Reingeniería

## 1. Resumen ejecutivo
Este documento describe la reingeniería del proyecto **conejomalo** para un ecommerce de Pet Shop, con foco en tiempo récord, reducción de complejidad y entrega de un **MVP estable** sin panel admin.

## 2. Objetivo
- Modernizar la arquitectura y el stack.
- Entregar un MVP funcional en el menor tiempo posible.
- Establecer bases para escalabilidad y mantenimiento.

## 3. Alcance (MVP)
Incluye:
- Autenticación (Supabase/Auth0).
- Catálogo de productos.
- Carrito de compras.
- Checkout (simulado si no hay pasarela activa).
- Órdenes e historial básico del usuario.

No incluye:
- Panel admin.
- Migración de datos legacy.
- Features avanzadas (cupones, recomendaciones, etc.).

## 4. Tecnologías propuestas
**Frontend**
- Next.js 15, TypeScript, Tailwind CSS
- State: React Context + Hooks
- HTTP: Fetch API
- Testing: Vitest + Testing Library

**Backend**
- NestJS + TypeScript
- ORM: Prisma
- Validación: Zod
- Auth: Supabase/Auth0
- Testing: Jest + Supertest
- Logging: Winston/Pino
- Caché: Redis

**Base de datos**
- PostgreSQL (principal)
- Redis (sesiones/caché)
- PostgreSQL Full-text search

**DevOps/Infra**
- Docker + Docker Compose
- CI/CD: GitHub Actions
- Observabilidad: Prometheus + Grafana
- Deploy: Render/Railway

**Documentación**
- OpenAPI 3.0
- C4 Model
- ADRs

## 5. Fases de ejecución (10 días)
**Día 1**: Alcance final + decisión de checkout
**Día 2**: Base técnica (frontend, backend, DB, CI/CD)
**Día 3**: Auth + login/registro
**Día 4**: Catálogo
**Día 5**: Carrito
**Día 6**: Checkout
**Día 7**: Órdenes
**Día 8**: Tests + logging
**Día 9**: OpenAPI + README técnico
**Día 10**: Deploy + validación final

## 6. Roles y responsabilidades (2 personas)
- **Persona A (Frontend):** UI, integración API, flujos
- **Persona B (Backend/Infra):** API, DB, Auth, CI/CD

## 7. Riesgos y mitigación
- **Riesgo:** retraso en auth → **Mitigación:** usar proveedor gestionado (Supabase/Auth0)
- **Riesgo:** complejidad de checkout → **Mitigación:** flujo simulado
- **Riesgo:** scope creep → **Mitigación:** congelar MVP

## 8. Criterios de éxito
- Flujo completo de compra funcional.
- CI/CD estable.
- Documentación mínima completa.
- Deploy público accesible.

## 9. Decisiones clave (ver ADR)
- ADR-001: Elección de Next.js 15
- ADR-002: NestJS + Prisma
