# API móvil (admin)

Esta guía resume los endpoints y payloads listos para apps móviles (Flutter nativo/web).
Para referencia completa y esquemas, consulta `/api-docs.html` (Redoc) o `/openapi.yaml`.

## Autenticación y CORS
- Autenticación: cookie `session` (JWT). Asegúrate de enviar la cookie en cada request a `/api/admin/*`.
- Flutter móvil/escritorio: puedes incluir header `Cookie: session=...`.
- Flutter Web: añade el origen a `CORS_ORIGINS` y usa `credentials: 'include'`.

## Subida de imágenes
- POST `/api/admin/uploads/image` (multipart/form-data)
  - fields: `file` (binario, requerido), `kind` (product|category|generic), `name` (opcional)
  - respuesta: `{ url }`
  - errores: `FILE_TOO_LARGE`, `INVALID_MIME`, `INVALID_EXT` (400)

También puedes subir imagen directamente al crear/editar productos y categorías (ver más abajo) con campo `image`.

## Roles
- GET `/api/admin/roles`
  - respuesta: lista de `{ id, name, label, description?, permissions: string[], users, usersCount }`
- GET `/api/admin/roles/{idOrName}`
  - respuesta: `{ id, name, label, description?, permissions: string[], users: string[] }`
- POST `/api/admin/roles`
  - body: `{ name, label, description?, permissions: string[] }`
- PUT `/api/admin/roles/{idOrName}`
  - body: `{ label?, description?, permissions? }`
- DELETE `/api/admin/roles/{idOrName}` → `{ ok: true }`
- GET `/api/admin/roles/{idOrName}/users`
  - respuesta: `{ items: [ { id, email, name, roles: [], createdAt } ] }`
- POST `/api/admin/roles/{idOrName}/assign`
  - body: `{ userId?: string, email?: string }` → `{ ok: true }`
- DELETE `/api/admin/roles/{idOrName}/users/{userId}` → `{ ok: true }`

## Usuarios
- GET `/api/admin/users?page&per&q`
  - respuesta: `{ items: [ { id, email, name, roles: string[], createdAt } ], page, per, total, totalPages }`
- POST `/api/admin/users`
  - body: `{ email, name?, roles: string[], password }`
  - respuesta: `{ id, email, name, roles[], createdAt }`
- GET `/api/admin/users/{id}`
  - respuesta: `{ id, email, name, roles[], createdAt }`
- PUT `/api/admin/users/{id}`
  - body: `{ email?, name?, roles?, password? }`
  - respuesta: `{ id, email, name, roles[], createdAt }`
- DELETE `/api/admin/users/{id}` → `{ ok: true }`

## Productos
- GET `/api/admin/products?page&per&q&cat&sort&active`
  - respuesta: array o `{ items, page, per, total, totalPages }` si hay params
- POST `/api/admin/products`
  - JSON: `{ name, price, description?, categoryId, active? }`
  - multipart: mismos campos + `image` (binario)
- PUT `/api/admin/products/{id}`
  - JSON/multipart (en multipart también `removeImage: "true"`)
- DELETE `/api/admin/products/{id}` → `{ ok: true }`

## Categorías
- GET `/api/admin/categories?page&per&q`
  - respuesta: array o `{ items, page, per, total, totalPages }`
- POST `/api/admin/categories`
  - JSON: `{ name, active? }`
  - multipart: mismos + `image`
- PUT `/api/admin/categories/{id}`
  - JSON/multipart (en multipart también `removeImage: "true"`)
- DELETE `/api/admin/categories/{id}` → `{ ok: true }`

## Pedidos
- GET `/api/admin/orders?page&per&q&status`
  - respuesta: `{ items: [ { id, status, customerName, customerEmail, itemsCount, subtotal, total, createdAt } ], page, per, total, totalPages }`
- GET `/api/admin/orders/{id}`
  - respuesta: `{
      id, status, customerName, customerEmail, customerPhone?, customerAddress?,
      subtotal, total, createdAt, userEmail?,
      items: [ { productName, productSlug, productId, qty, unitPrice, total } ]
    }`
- PUT `/api/admin/orders/{id}` (status alias) o PATCH
  - body: `{ status }`
  - respuesta: `{ ok, from, to }`

## Métricas y export
- Todas aceptan `from`, `to` y `g` con `d|w|m` (mapeado a day/week/month).
- GET `/api/admin/metrics/export/summary|timeseries|top-products|categories|orders-status?format=json|csv[&limit=N]`
  - JSON devuelve la estructura correspondiente (o CSV con Content-Type `text/csv`).

## Ejemplos (Flutter http)

Subir imagen genérica:
```dart
final req = http.MultipartRequest('POST', api.resolve('/api/admin/uploads/image'))
  ..headers['Cookie'] = sessionCookie
  ..fields['kind'] = 'product'
  ..files.add(await http.MultipartFile.fromPath('file', imagePath));
final res = await req.send();
```

Crear usuario:
```dart
final res = await http.post(
  api.resolve('/api/admin/users'),
  headers: { 'Content-Type': 'application/json', 'Cookie': sessionCookie },
  body: jsonEncode({ 'email': 'john@example.com', 'roles': ['MANAGER'], 'password': 'Secret123' }),
);
```

Crear producto con imagen:
```dart
final req = http.MultipartRequest('POST', api.resolve('/api/admin/products'))
  ..headers['Cookie'] = sessionCookie
  ..fields['name'] = 'Playera'
  ..fields['price'] = '299.99'
  ..fields['categoryId'] = categoryId
  ..files.add(await http.MultipartFile.fromPath('image', imagePath));
final res = await req.send();
```
