# API Reference (Ampliada)

Base: `https://<host>/api` (en desarrollo: `http://localhost:3000/api`). Todas las respuestas son JSON salvo exportaciones CSV.

Documentación generada (OpenAPI):
- Especificación: `/openapi.yaml`
- Visor Redoc: `/api-docs.html`

---
## Índice
1. Principios & Convenciones
2. Autenticación y Sesión
3. RBAC y Permisos
4. CORS y Consumo desde Flutter Web
5. Paginación, Filtrado y Ordenación
6. Modelo de Datos (Tipos / Esquemas)
7. Errores y Códigos de Estado
8. Endpoints Públicos
9. Carrito
10. Órdenes
11. Autenticación (Auth)
12. Endpoints Admin (CRUD + Usuarios + Roles)
13. Métricas / Dashboard / Export
14. Ejemplos (curl / fetch / Dart Dio)
15. Versionado y Cambios Futuros
16. Checklist de Integración Flutter

---
## 1. Principios & Convenciones
| Convención | Descripción |
|------------|-------------|
| Timestamps | ISO 8601 (UTC) `YYYY-MM-DDTHH:mm:ss.sssZ` |
| IDs | `cuid()` (string) |
| Moneda | Campo decimal con 2 decimales (almacenado como string decimal) representado en MXN (ajustable) |
| Booleanos | `true` / `false` |
| Campos opcionales | Ausentes o `null` (evitamos `undefined` en respuestas) |
| Orden por defecto | Productos y usuarios: `createdAt desc` |
| Seguridad | Permisos verificados en server (no confiar en UI) |

---
## 2. Autenticación y Sesión
| Elemento | Detalle |
|----------|--------|
| Método | Cookie de sesión `session` (JWT HS256) httpOnly, SameSite=Lax |
| Vida | 7 días (renovar con re-login) |
| Login | `POST /api/auth/login` |
| Registro | `POST /api/auth/register` (auto-login) |
| Cierre | `POST /api/auth/logout` |
| Estado | `GET /api/auth/me` -> `{ authenticated, sub, email, name, role, permissions[] }` |

No se exponen tokens Bearer. Para aplicaciones externas Web (Flutter) usar solicitudes con credenciales (cookies) o, si se desea modo stateless, se podría extender a emitir tokens de API (no implementado).

---
## 3. RBAC y Permisos
Permisos base (seed RBAC):
`admin:access`, `dashboard:access`, `product:read|create|update|delete`, `category:read|create|update|delete`, `order:read`, `order:manageStatus`, `user:read|create|update|delete`, `role:read|update`, `dashboard:export`.

Roles semilla:
| Rol | Permisos Clave |
|-----|----------------|
| admin | Todos |
| manager | admin:access + CRUD productos/categorías + order:read/manageStatus |
| support | product:read, category:read, order:read |
| viewer | product:read, category:read |

Autorización endpoint = poseer el permiso específico o `admin:access`.

---
## 4. CORS y Flutter Web
Configurado vía `middleware.ts`.
| Variable | Ejemplo | Descripción |
|----------|---------|-------------|
| `CORS_ORIGINS` | `http://localhost:3000,http://localhost:59669` | Lista blanca ORIGENES |
| `CORS_ALLOW_CREDENTIALS` | `true` | Añade `Access-Control-Allow-Credentials: true` |

### Admin Products create (`POST /api/admin/products`)
Permiso: `product:create`.

Payloads soportados:
- JSON: `{ name: string, price: number|string, description?: string|null, categoryId: string, active?: boolean }`
- multipart/form-data: campos anteriores + `image: File` opcional

Respuestas:
- 201: `Product`
- 400: `MISSING_FIELDS|INVALID_PRICE|FILE_TOO_LARGE|INVALID_MIME|INVALID_EXT`
- 401/403 auth/permiso

### Admin Products update (`PUT /api/admin/products/:id`)
Permiso: `product:update`.

Payloads soportados:
- JSON: `{ name: string, price: number|string, description?: string|null, categoryId: string, active?: boolean, imageUrl?: null }` (imageUrl=null elimina imagen)
- multipart/form-data: mismos campos + `image: File` opcional + `removeImage: 'true'` para eliminar

Respuestas:
- 200: `Product`
- 400/401/403/404 según validación y permisos

### Admin Products delete (`DELETE /api/admin/products/:id`)
- Respuesta 200: `{ ok: true }`
- 404 si no existe

### Admin Categories list/create/update/delete
- `GET /api/admin/categories` (category:read) -> `Category[]`
- `POST /api/admin/categories` (category:create)
	- JSON: `{ name: string, active?: boolean }`
	- multipart/form-data: + `image: File` opcional
	- 201: `Category`
- `PUT /api/admin/categories/:id` (category:update)
	- JSON: `{ name: string, active?: boolean, removeImage?: boolean }`
	- multipart/form-data: + `image: File` opcional + `removeImage: 'true'`
	- 200: `Category`
- `DELETE /api/admin/categories/:id` (category:delete) -> `{ ok: true }`

### Admin Users list/create/get/update/delete/search
- `GET /api/admin/users` (user:read) -> `User[]`
- `POST /api/admin/users` (user:create)
	- `{ email: string, name?: string, roleIds?: string[] }`
	- 201: `User`
- `GET /api/admin/users/:id` (user:read) -> `User`
- `PUT /api/admin/users/:id` (user:update)
	- `{ name?: string|null, roleIds?: string[] }` -> `User`
- `DELETE /api/admin/users/:id` (user:delete) -> `{ ok: true }`
- `GET /api/admin/users/search?q=` -> `Array<{ id: string, email: string, name: string|null }>`

### Admin Roles list/create/get/update/delete/assign
- `GET /api/admin/roles` (role:read)
	- Respuesta: `Array<{ id, name, label, description, permissions: string[], users: number }>`
- `POST /api/admin/roles` (role:update)
	- `{ name: string, label?: string, description?: string|null, permissions?: string[] }` -> 201 `{ id, name, label, description, permissions }`
- `GET /api/admin/roles/:id` (role:read)
	- `{ id, name, label, description, permissions: string[], users: string[] }`
- `PUT /api/admin/roles/:id` (role:update)
	- `{ label?: string, description?: string|null, permissions?: string[] }` -> `{ ok: true }`
- `DELETE /api/admin/roles/:id` (role:update) -> `{ ok: true }`
- `POST /api/admin/roles/:id/assign` (role:update)
	- `{ userId: string }` -> `{ ok: true }`
- `DELETE /api/admin/roles/:id/assign` (role:update)
	- `{ userId: string }` -> `{ ok: true }`

### Admin Orders list/get/update
- `GET /api/admin/orders` (order:read)
	- Query: `q`, `status`, `page`, `limit`
	- Respuesta: `{ total, page, pageSize, orders: Order[] }`
- `GET /api/admin/orders/:id` (order:read)
	- Orden completa con `items` y `user { id, email }`
- `PATCH /api/admin/orders/:id` (order:manageStatus)
	- `{ status: 'PENDING'|'PAID'|'SHIPPED'|'COMPLETED'|'CANCELED' }` -> `{ ok: true, from, to }`

### Admin Permissions cache invalidate (`POST /api/admin/permissions/invalidate`)
- Permiso: `role:update`
- Request: `{ userId?: string }` (si omites, invalida global)
- Response: `{ ok: true, scope: 'single'|'all' }`

Requisitos para solicitudes con cookies:
1. Origen en lista blanca.
2. `Access-Control-Allow-Origin` = origen exacto, no `*`.
3. Cliente (Dio / fetch) con `withCredentials = true` / `credentials:'include'`.

Para endpoints públicos sin sesión puedes omitir credenciales y aceptar `*`.

---
## 5. Paginación, Filtrado y Ordenación
Patrón soportado (en endpoints que lo implementan):
`?page=<n>&per=<n>&sort=<clave>&q=<texto>&cat=<categoryId/slug>`

| Parámetro | Descripción | Default | Máx |
|-----------|-------------|---------|-----|
| `page` | Página 1-based | 1 | - |
| `per` | Items por página | 24 (productos búsqueda) | 60 (productos búsqueda) |
| `sort` | Ej: `new`, `price_asc`, `price_desc`, `name` | Depende endpoint | - |
| `q` | Texto (>=2 chars) | - | - |
| `cat` | Filtro categoría (id o slug) | - | - |
| `priceMin`/`priceMax` | Filtros de rango precio | - | - |

Respuesta paginada estándar:
```json
{
	"items": [...],
	"page": 2,
	"per": 24,
	"total": 134,
	"totalPages": 6
}
```

Endpoints actualmente paginados en UI interna (Search y Category). `/api/products` ahora soporta paginado y filtros opcionales manteniendo compatibilidad retro.

---
## 6. Modelo de Datos (Esquemas Simplificados)
### Product
```ts
type Product = {
	id: string;
	name: string;
	slug: string;
	description?: string | null;
	price: string;            // decimal(10,2) serializado
	imageUrl?: string | null;
	categoryId: string;
	active: boolean;
	createdAt: string;        // ISO
	updatedAt: string;        // ISO
	category?: { id: string; name: string };
}
```

### Category
```ts
type Category = { id: string; name: string; slug: string; active: boolean; createdAt: string; imageUrl?: string | null }
```

### CartItem (cookie `cart`)
```ts
type RawCart = { items: { productId: string; qty: number }[] };
type EnrichedCartItem = { productId: string; qty: number; name: string; price: string; lineTotal: string };
```

### Order / OrderItem
```ts
type OrderItem = { id: string; productId: string; name: string; slug: string; unitPrice: string; quantity: number };
type Order = {
	id: string; customer: string; email: string; address: string; phone: string;
	subtotal: string; total: string; status: 'PENDING'|'PAID'|'SHIPPED'|'COMPLETED'|'CANCELED';
	createdAt: string; items: OrderItem[];
}
```

### Auth Session (front)
```ts
type Session = { sub: string; email: string; role: 'USER'|'ADMIN'; permissions: string[] };
```

### Error Shape
```ts
type ApiError = { error: string; code?: string; fields?: Record<string,string> };
```

---
## 7. Errores y Códigos
| Código | Uso |
|--------|-----|
| 200 | OK |
| 201 | Creado |
| 204 | Sin contenido (p.ej. preflight, borrado sin body) |
| 400 | Datos incompletos / invalidaciones simples |
| 401 | No autenticado (token ausente/inválido) |
| 403 | Autenticado pero sin permiso |
| 404 | Recurso no existe |
| 409 | Conflicto (duplicados) |
| 422 | Validación campo-específica (si se adopta) |
| 500 | Error interno |

Todas las respuestas de error: `{ error: <mensaje>, code?: <código simbólico> }` y opcional `fields` para errores por campo.

---
## 8. Endpoints Públicos
### GET `/api/products`
Soporta filtro y paginación opcional.

- Sin query params: devuelve lista completa `Product[]` (activos).
- Con cualquier parámetro (`page`, `per`, `sort`, `q`, `cat`): devuelve objeto paginado.

Parámetros:
- `page`: número de página (>=1). Default 1.
- `per`: items por página. Default 24. Máx 60.
- `sort`: `new` | `price_asc` | `price_desc` | `name`. Default `new`.
- `q`: texto (>=2 chars) en nombre/descripcion.
- `cat`: id de categoría o slug (acepta cualquiera).

Respuestas:
- Sin params: `Product[]` (incluye `category: { id, name, slug }`).
- Con params:
```json
{ "items": [], "page":1, "per":24, "total":0, "totalPages":1 }
```

Ejemplos:
```bash
# Por categoría (slug)
curl 'http://localhost:3000/api/products?cat=juguetes'

# Por categoría (id) y orden precio asc
curl 'http://localhost:3000/api/products?cat=ckat_123&sort=price_asc&page=1&per=24'

# Búsqueda + categoría (se combinan con AND)
curl 'http://localhost:3000/api/products?q=heno&cat=alimento'
```

### GET `/api/categories`
`{ categories: Category[] }` sólo activas.

### GET `/api/products/:slugOrId`
Obtiene un único producto activo por `slug` o `id` (público).

Respuesta:
```json
{
	"id": "ck_prod_123",
	"name": "Heno premium",
	"slug": "heno-premium",
	"description": "...",
	"price": "120.00",
	"imageUrl": "/media/...",
	"categoryId": "ck_cat_1",
	"active": true,
	"createdAt": "2025-10-01T12:34:56.000Z",
	"updatedAt": "2025-10-02T12:34:56.000Z",
	"category": { "id": "ck_cat_1", "name": "Alimento", "slug": "alimento" }
}
```

Errores:
- 404 `{ "error": "Product not found" }`
- 500 `{ "error": "Error fetching product" }`

Ejemplos:
```bash
curl 'http://localhost:3000/api/products/heno-premium'
curl 'http://localhost:3000/api/products/ck_prod_123'
```

### GET `/api/search?q=term&cat=&page=&per=&sort=`
Busca en nombre / descripción (min 2 chars). Respuesta:
```json
{ "items": Product[], "total": 120, "page": 1, "per": 24, "totalPages": 5 }
```

---
## 9. Carrito
Cookie: `cart`.
### GET `/api/cart`
```json
{ "items": [{"productId":"...","qty":2}], "subtotal":"120.00", "enriched":[{"productId":"...","qty":2,"name":"","price":"60.00","lineTotal":"120.00"}] }
```
### POST `/api/cart`
Body: `{ "productId": "...", "qty": 2 }` (>=1) -> agrega / incrementa.
### PUT `/api/cart`
Body: `{ productId, qty }` (>=0) -> 0 elimina.
### DELETE `/api/cart`
Body: `{ productId }` -> elimina ítem.

Errores: 400 qty inválida, 404 productId inexistente.

---
## 10. Órdenes
### POST `/api/orders`
Body:
```json
{ "customer":"Nombre", "email":"a@b.com", "phone":"+521...", "address":"Calle 123" }
```
Precondición: carrito no vacío.
Respuesta 201:
```json
{ "id":"...","customer":"...","email":"...","items":[...],"subtotal":"100.00","total":"116.00","status":"PENDING","createdAt":"2025-10-04T12:00:00.000Z" }
```

---
## 11. Autenticación
### POST `/api/auth/register`
Crea usuario (rol por defecto USER). Autologin.
### POST `/api/auth/login`
Body: `{ email, password }` => `{ ok: true }`.
### POST `/api/auth/logout`
=> `{ ok: true }` (borra cookie).
### GET `/api/auth/me`
Respuesta autenticado:
```json
{ "authenticated": true, "sub":"userId", "email":"a@b.com", "name":"Nombre", "role":"USER", "permissions":["product:read"] }
```

---
## 12. Endpoints Admin / Permisos
Requieren login + permiso específico o `admin:access`.

| Endpoint | Método | Permiso |
|----------|--------|---------|
| `/api/admin/products` | GET | product:read |
| `/api/admin/products` | POST | product:create |
| `/api/admin/products/:id` | GET | product:read |
| `/api/admin/products/:id` | PUT | product:update |
| `/api/admin/products/:id` | DELETE | product:delete |
| `/api/admin/products/search` | GET | product:read |
| `/api/admin/categories` | GET | category:read |
| `/api/admin/categories` | POST | category:create |
| `/api/admin/categories/:id` | PUT | category:update |
| `/api/admin/categories/:id` | DELETE | category:delete |
| `/api/admin/categories/search` | GET | category:read |
| `/api/admin/users` | GET | user:read |
| `/api/admin/users` | POST | user:create |
| `/api/admin/users/:id` | GET | user:read |
| `/api/admin/users/:id` | PUT | user:update |
| `/api/admin/users/:id` | DELETE | user:delete |
| `/api/admin/roles` | GET | role:read |
| `/api/admin/roles` | POST | role:update |
| `/api/admin/roles/:id` | PUT/DELETE | role:update |
| `/api/admin/roles/:id/assign` | POST/DELETE | role:update |
| `/api/admin/metrics/export/*` | GET | dashboard:export |
| `/api/admin/audit` | GET | audit:read |
### Admin Products list (`GET /api/admin/products`)
Soporta filtros y paginación, manteniendo compatibilidad sin params (devuelve array completo ordenado):

Parámetros: `page`, `per` (max 100), `sort` (`new|price_asc|price_desc|name`), `q` (texto nombre/descr), `cat` (id o slug), `active` (`true|false|all`).

Respuesta con params:
```json
{ "items": [], "page":1, "per":20, "total":0, "totalPages":1 }
```

### Admin Products search (`GET /api/admin/products/search`)
Params: `q` (texto), `cat` (opcional), `limit` (1..50, default 10).
Devuelve arreglo con `{ id, name, slug, price, category:{ id,name } }`.

### Admin Categories search (`GET /api/admin/categories/search`)
Params: `q`, `limit` (1..50, default 10). Devuelve `{ id, name, slug }[]`.

### Admin Audit list (`GET /api/admin/audit`)
Params: `limit` (1..200, default 50), `cursor` (id para paginado), `q` (filtra por acción/entidad/email).
Respuesta: `{ items: [{ id, createdAt, userEmail, action, entity, entityId, metadata }], nextCursor }`.


Notas:
- Cambios de roles invalidan cache de permisos inmediatamente.
- El campo `user.role` (enum) es legacy; confiar en permisos reales.

---
## 13. Métricas / Dashboard
Endpoints (nombres orientativos; confirmar en código si cambian):
| Ruta | Descripción |
|------|-------------|
| `/api/admin/metrics/summary` | KPIs agregados |
| `/api/admin/metrics/top-products` | Ranking ventas / ingresos |
| `/api/admin/metrics/categories` | Distribución por categoría |
| `/api/admin/metrics/orders-status` | Conteo por estado |
| `/api/admin/metrics/timeseries` | Serie temporal ingresos/pedidos |
| `/api/admin/metrics/export/<kind>` | Export CSV (permiso `dashboard:export`) |

Formato export CSV: cabeceras en español, separador coma UTF-8.

---
## 14. Ejemplos
### curl (público)
```bash
curl 'http://localhost:3000/api/search?q=heno'
```
### curl con cookie sesión (admin)
```bash
curl -H 'Cookie: session=<JWT>' http://localhost:3000/api/admin/products
```
### fetch JS (credenciales)
```js
fetch('http://localhost:3000/api/products',{credentials:'include'})
	.then(r=>r.json()).then(console.log);
```
### Dart (Dio) público
```dart
final dio = Dio(BaseOptions(baseUrl: 'http://localhost:3000/api'));
final res = await dio.get('/products');
print(res.data);
```
### Dart (Dio) autenticado con credenciales
```dart
final dio = Dio(BaseOptions(baseUrl: 'http://localhost:3000/api'));
(dio.httpClientAdapter as BrowserHttpClientAdapter).withCredentials = true;
final res = await dio.get('/admin/products');
```

---
## 15. Versionado y Cambios Futuros
Versión actual: v1 (implícita). Cambios breaking futuros: prefijo `/api/v2/...` o encabezado `Accept: application/vnd.app.v2+json` (por definir).
Plan sugerido:
- Añadir paginación a `/api/products` (v1 non-breaking aceptando query params opcionales).
- Introducir endpoints `PATCH` parciales para recursos grandes.
- Emitir ETags para caching condicional.
- Rate limiting (no implementado) – sugerencia: `X-RateLimit-*`.

---
## 16. Checklist Integración Flutter
1. Definir `CORS_ORIGINS` con puerto actual de Flutter.
2. Para endpoints públicos: omitir credenciales.
3. Para admin: `withCredentials = true` + login previo en mismo origen navegador.
4. Manejar errores: si status 401 -> redirigir a login interno web (o flujos OAuth futuros).
5. Implementar paginado cliente (fallback hasta que `/api/products` soporte server-side pagination).
6. Normalizar precios (`Number.parseFloat(price)`), no asumir integer.
7. Respetar mínima longitud de búsqueda (>=2) antes de llamar `/api/search`.

---
## Preguntas Frecuentes
**¿Por qué no hay tokens Bearer?**
Se priorizó simpleza con cookie httpOnly. Puede agregarse emisión de tokens personales si se requiere cliente nativo totalmente aislado.

**¿Cómo invalidar sesión manualmente?** `POST /api/auth/logout` o borrar cookie `session`.

**¿Cómo saber si mis permisos cambiaron?** Llamar periódicamente `GET /api/auth/me` (cache no-store) o escuchar un evento interno tras actualizar roles.

---
Fin de documento.
