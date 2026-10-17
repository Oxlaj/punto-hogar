# Arquitectura

## Visión General
Aplicación e-commerce ligera construida con **Next.js App Router**, **Prisma**, **PostgreSQL** y **Tailwind CSS**. El objetivo es ofrecer catálogo, carrito basado en cookies y flujo de órdenes sin requerir autenticación obligatoria, con posibilidad de registrar usuarios y rol ADMIN. 

En iteraciones recientes se añadió y evolucionó un **Dashboard Analítico Corporativo** con:
- Métricas comparativas (periodo vs periodo anterior)
- Visualizaciones múltiples (líneas, áreas, barras, dona, stacked, radial, Pareto 80/20)
- Exportación CSV
- Modo responsivo / denso avanzado
- Filtros de fecha rediseñados (validación + presets inteligentes + navegación diferida)
- Widgets compactos expandibles (dona de categorías clickable → modal)

## Capas
- **UI / Rutas (app/)**: Server Components para render inicial y Client Components para interacción (Navbar, búsqueda, carrito, auth provider, dashboard charts). El dashboard combina server fetching (agregación Prisma) con componentes visuales client (Recharts) protegidos con montado diferido para evitar hydration mismatch. Nuevos patrones: widgets compact→overlay, controles de fecha con estado local + `useTransition`, y adaptación dinámica mediante `ResizeObserver`.
- **API Routes (app/api)**: Endpoints REST (productos, categorías, búsqueda, carrito, auth, órdenes, administración CRUD) + endpoints de métricas / export (CSV) asociados al dashboard.
- **Dominio / Datos (Prisma)**: Modelos `User`, `Product`, `Category`, `Order`, `OrderItem`, `AuditLog`.
- **Capa de Métricas (src/lib/metrics.ts)**: Funciones puras de agregación (summary, time series, top products, distribution, order status breakdown/totals, user series). Devuelven estructuras simples serializables.
- **Estado en cliente**: Mínimo; se usan hooks locales y eventos `CustomEvent` (`cart:updated`, `auth:changed`). Dashboard mantiene sólo toggles locales (modo ingresos/pedidos, modo denso, granularidad, expand/collapse). Filtros de fecha ahora usan estado controlado + validación antes de aplicar (evita navegaciones erróneas).
- **Autenticación**: Cookie de sesión JWT (`session`) + cookie auxiliar `auth_user_id` (legado / compat). Ver `docs/auth-cart.md`.
- **Carrito**: Cookie no-HTTPOnly `cart` para acceso directo desde cliente sin roundtrips adicionales.

## Flujo de Peticiones
1. Usuario carga página -> Server Components consultan Prisma.
2. Acciones (agregar a carrito) llaman `/api/cart` -> escribe cookie -> UI dispara evento y re-render local.
3. Checkout crea orden en `/api/orders` leyendo cookie + validación + persistencia.
4. Autenticación modifica cookies (`session`, `auth_user_id`) -> `AuthProvider` refetchea `/api/auth/me`.
5. Dashboard: server component `/admin` obtiene en paralelo: summary, previous summary, series temporal, user series, top products, distribution, order status breakdown & totals, recent orders. Las respuestas se cachean por request (no global) al usarse `dynamic = 'force-dynamic'` para datos vivos.

## Decisiones Clave
| Decisión | Justificación | Alternativa futura |
|----------|---------------|--------------------|
| Carrito en cookie JSON | Simplicidad, sin tablas extra | Persistir carrito por usuario autenticado en DB |
| JWT manual (jose) | Control fino y dependencia mínima | Auth.js / NextAuth para social login |
| Eventos custom para sincronía | Evita context global | React Context + Reducer central |
| Búsqueda simple LIKE | Rápido implementar | Full‑text index / Elastic / Meilisearch |
| Tailwind utilitario | Rapidez de iteración | Design system con componentes compuestos |
| Recharts + montaje controlado | Evitar problemas SSR/hydration y mantener bundle moderado | Bibliotecas internas canvas / ECharts |
| Métricas en una sola función agregadora por tipo | Simplicidad y reducción de queries repetidas | Materializar vistas SQL / ETL nocturno |
| Modo denso (clase `dense-mode`) | Optimiza uso de espacio en mobile y grandes paneles | Layout condicional por usuario almacenado en DB |

## Convenciones
- Archivos API usan funciones HTTP export nombradas (`GET`, `POST`, etc.).
- Modelos usan naming singular PascalCase; tablas generadas por Prisma.
- Slugs generados en minúsculas reemplazando no-alfa-num por guiones.
- Validaciones mínimas en endpoints; errores JSON con `{ error, fields? }`.

## Seguridad
- Cookies de sesión `httpOnly` y `secure` en producción.
- No se exponen hashes ni campos sensibles.
- Validación básica de inputs (ej. longitud, formato email/phone).
- Límites carrito (`MAX_ITEMS`, `MAX_PER_ITEM`).

## Rendimiento
- Carga rápida: pocas dependencias, SSR + streaming.
- Fetch paralelo en dashboard con `Promise.all` minimizando latencia total.
- Recharts se carga estáticamente pero renderiza sólo tras `mounted` para evitar hydration mismatch.
- Modo denso reduce DOM (leyendas, padding) mejorando pintado en móviles.
- Pendiente: caching selectivo de métricas y revalidate on write; compresión de payload CSV.

## Accesibilidad
- Botones y enlaces con `aria-label` donde el icono es único (carrito, menú).
- Estados de foco visibles (`focus:ring`).
- Dropdown menú cierra con click externo.

## Observabilidad (Pendiente)
- Logging estructurado & métricas (OpenTelemetry) planificados.
- Futuro: contador de tiempos de consulta Prisma y latencias por endpoint de métricas.

## Auditoría
Se implementó un registro de auditoría (`AuditLog`) para trazabilidad de acciones administrativas y de cambios de estado en pedidos. Cada entrada guarda:
- userId (opcional si la acción es anónima)
- action (ej. `product.create`, `role.update`, `order.status.update`)
- entity + entityId (referencia lógica a la entidad afectada)
- metadata JSON (snapshot mínimo o diffs relevantes)
- timestamp

Página dedicada: `/admin/audit` (Server Component) con paginación por cursor y permiso granular `audit:read`. Este permiso fue agregado al seed (`seed-rbac`) y asignado a los roles `admin` y `manager`.

Futuras extensiones:
- Filtros por rango de fechas / acción / entidad
- Export CSV / JSON
- Vista expandible o diff visual
- Retención configurable y limpieza automática

## Diagrama Simplificado
```
[Browser]
  | UI events
  v
[Next.js Routes + Server Components]
  | Prisma Client
  v
[PostgreSQL]
```

## Dashboard Analítico (Resumen Técnico)
Componentes clave (carpeta `components/dashboard`):
- `RevenueOrdersChart` línea dual (toggle ingresos/pedidos) con ajustes densos.
- `RevenueUnitsBarChart` barras comparativas ingresos vs unidades.
- `CumulativeRevenueChart` área acumulada.
- `CancelRateChart` línea porcentaje cancelados.
- `UserGrowthChart` área nuevos usuarios.
- `CategoryDistribution` (modo normal y `compact` → modal expandible con ESC).
- `OrderStatusChart` stacked area estados (ticks y leyenda adaptativos). 
- `TopProductsParetoChart` (reemplaza a barras simples) con línea de % acumulado, `ReferenceLine` al 80% y badge “80% ingresos: N prod”.
- `StatusRadial` radial composición total estados.
- `UpdateCard` resumen delta ingresos.
- `DenseModeToggle` modo compacto global.
- `DashboardFilters` rediseñado (presets, validaciones, apply diferido, detección de preset activo, spinner transición, resumen de días).

### Métricas Servidor (`src/lib/metrics.ts`)
- `getSummaryMetrics(range)`: totales + usuarios + cancelaciones.
- `previousRange(range)`: range anterior mismo tamaño.
- `getTimeSeries(range)`: revenue, orders, units por bucket.
- `getUserSeries(range)`: nuevos usuarios.
- `getTopProducts(range, limit)`.
- `getCategoryDistribution(range)`.
- `getOrderStatusBreakdown(range)` y `getOrderStatusTotals(range)`.
- CSV helpers (`toCsv`, `exportSummaryCsv`).

### Responsive & Modo Denso
- Grid reorganizada: detalle ahora muestra Pareto + estados (prioridad analítica) a la izquierda y pedidos recientes + dona compacta a la derecha.
- `dense-mode` reduce paddings, alturas y elimina leyendas redundantes.
- `ResizeObserver` adapta márgenes / radios; eje y leyenda se ocultan en anchos ultraestrechos.
- Vista compacta mantiene accesibilidad mediante overlay con listado textual.

### Permisos Dashboard
Se requiere uno de: `admin:access` o `dashboard:access`. Auditoría requiere `audit:read`.

### Evolución Reciente del Dashboard
| Cambio | Razón | Resultado |
|--------|-------|-----------|
| Pareto (TopProductsParetoChart) | Mostrar concentración (regla 80/20) | Insight inmediato y accionable |
| Rediseño filtros fecha | Evitar errores y confusión | Menos requests, validaciones claras, UX consistente |
| Dona compacta expandible | Optimizar ancho y mantener detalle bajo demanda | Ahorro de espacio sin perder contexto |
| Ticks adaptativos / ocultar leyenda | Legibilidad en móviles | Gráficas no se “cortan” y siguen entendibles |
| `useTransition` en apply | Navegación fluida | Estado “Aplicar” con feedback visual |

### Posibles Mejoras Futuras
- Persistir preferencia de modo denso y último rango (localStorage).
- Auto-selección de granularidad según longitud del rango.
- Export adicional: cancel-rate / cumulative-revenue.
- Dark mode temático.
- Cache incremental / materialización de series históricas.
- Filtros combinados (categoría / estado) con tagging en URL.

## Roles y Permisos (Resumen)
Ver documento dedicado `docs/rbac.md` (si existe). Principales:
- `admin:access` (control total panel)
- `dashboard:access` (sólo visualización métricas)
- `audit:read` (acceso a logs)
- Otros CRUD (productos, categorías, usuarios) definidos en capa de permisos.

## Próximas Mejoras Sugeridas
- Persistir carrito para usuarios autenticados (merge cookie + DB).
- Roles granulares (staff, support).
- Webhooks de pago (Stripe) y estados de orden.
- Revalidate on write (`revalidatePath`/`tag`) para caching selectivo.
- Cache y/o materialización de métricas históricas.
- Panel dark/light y guardado de preferencias UI.
