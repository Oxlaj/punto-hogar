# API Métricas & Exportación

Base admin (protegida por permiso `dashboard:access`):
```
/ api / admin / metrics / export / [kind]
```
`[kind]` ∈ `summary | timeseries | top-products | categories | orders-status`

Todos aceptan query params estándar de rango:
| Parámetro | Tipo | Default | Descripción |
|-----------|------|---------|-------------|
| `from` | YYYY-MM-DD | (now-29d) | Fecha inicial (UTC, inclusive). |
| `to` | YYYY-MM-DD | (hoy) | Fecha final (UTC, inclusive). |
| `g` | `day|week|month` | `day` | Granularidad agregaciones donde aplica. |
| `format` | `csv|json` | `csv` | Formato deseado de respuesta. |
| `limit` | number | 50 (solo top-products) | Máximo de productos a devolver / exportar. |

## Autenticación & Autorización
- Requiere sesión válida.
- Debe poseer al menos el permiso `dashboard:access` (o `admin:access`).
- Respuestas de error: `401 UNAUTHENTICATED`, `403 FORBIDDEN`.

## Respuestas Generales
- `format=json` → `application/json` con payload estructurado.
- `format=csv` → `text/csv` + header `Content-Disposition` para descarga con nombre `<kind>-<from>_<to>.csv`.
- Errores → `{ error: <CODE> }`.

## Kinds
### 1. summary
Agregados globales período.

JSON shape:
```jsonc
{
  "range": { "from": "2025-09-01", "to": "2025-09-30", "granularity": "day" },
  "totals": { "revenue": 1234.56, "orders": 42, "aov": 29.39, "units": 87 },
  "users": { "newUsers": 5, "buyers": 4, "repeat": 1 },
  "orders": { "canceled": 2, "canceledPct": 0.0476 },
  "generatedAt": "2025-10-03T18:11:22.000Z"
}
```
CSV: filas `metric,value` (ver helper `exportSummaryCsv`).

### 2. timeseries
Serie temporal bucketizada según `g`.

JSON array (orden cronológico):
```jsonc
[
  { "date": "2025-09-01", "revenue": 120.5, "orders": 3, "units": 5 },
  { "date": "2025-09-02", "revenue": 80, "orders": 1, "units": 2 }
]
```
CSV columnas: `date,revenue,orders,units`.

### 3. top-products
Ranking por ingresos (desc), limitado por `limit`.

JSON:
```jsonc
[
  { "productId": "abc123", "name": "Producto A", "revenue": 500.00, "units": 10 },
  { "productId": "def456", "name": "Producto B", "revenue": 250.00, "units": 5 }
]
```
CSV columnas: `productId,name,revenue,units`.

### 4. categories
Distribución por categoría (orden desc ingresos).

JSON:
```jsonc
[
  { "categoryId": "cat1", "name": "Juguetes", "revenue": 900.0, "units": 30 },
  { "categoryId": "cat2", "name": "Alimento", "revenue": 140.0, "units": 8 }
]
```
CSV columnas: `categoryId,name,revenue,units`.

### 5. orders-status
Serie temporal por estado (stacked source) – mismo orden temporal que `timeseries`.

JSON:
```jsonc
[
  { "date": "2025-09-01", "PENDING": 1, "PAID": 0, "SHIPPED": 0, "COMPLETED": 0, "CANCELED": 0 },
  { "date": "2025-09-02", "PENDING": 0, "PAID": 1, "SHIPPED": 0, "COMPLETED": 0, "CANCELED": 0 }
]
```
CSV columnas: `date,PENDING,PAID,SHIPPED,COMPLETED,CANCELED`.

## Códigos de Error API
| Código | HTTP | Motivo |
|--------|------|--------|
| INVALID_KIND | 400 | `kind` fuera de lista soportada |
| INVALID_FORMAT | 400 | `format` distinto de csv/json |
| UNAUTHENTICATED | 401 | Sesión inválida / ausente |
| FORBIDDEN | 403 | Falta permiso |
| SERVER_ERROR | 500 | Error interno inesperado |

## Recomendaciones de Uso
- Para rangos muy largos considerar `g=week` o `g=month` para reducir filas.
- Limitar `limit` de `top-products` a lo realmente necesario (pareto 80/20 suele requerir < 30).
- Cachear CSV en cliente si se reutiliza en export múltiple (evitar picos de tráfico). 
- Validar fechas antes de construir URLs (el front ya lo hace con el nuevo componente de filtros).

## Ejemplos cURL
```bash
# Summary JSON últimos 30 días
curl \
  "/api/admin/metrics/export/summary?format=json&from=2025-09-01&to=2025-09-30"

# Timeseries CSV semana actual
curl \
  -H "Accept: text/csv" \
  "/api/admin/metrics/export/timeseries?g=day&format=csv&from=2025-09-28&to=2025-10-04" -o timeseries.csv

# Top 20 productos (JSON)
curl \
  "/api/admin/metrics/export/top-products?limit=20&format=json&from=2025-09-01&to=2025-09-30"
```

## Futuras Extensiones (No Implementadas)
| Idea | Descripción | Posible endpoint |
|------|-------------|------------------|
| cancel-rate | Serie de tasa de cancelación | `/api/admin/metrics/export/cancel-rate` |
| cumulative-revenue | Serie acumulada | `/api/admin/metrics/export/cumulative-revenue` |
| pareto-products | Data pre-procesada con índice 80% | `/api/admin/metrics/export/pareto-products` |
| users-growth | Métrica de nuevos usuarios | `/api/admin/metrics/export/users-growth` |

---
Mantener este documento sincronizado cuando se agreguen nuevos `kind` o formatos.
