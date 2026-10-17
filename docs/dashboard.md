# Dashboard Analítico

Este documento profundiza en la arquitectura, métricas y decisiones de diseño del panel de control.

## Objetivos
- Visibilidad de desempeño (ventas, pedidos, usuarios, cancelaciones) en un solo lugar.
- Comparativa periodo actual vs periodo anterior de igual longitud.
- Visualizaciones múltiples optimizadas para escritorio y mobile.
- Exportación de datos (CSV) y accesibilidad básica.
- Modo denso para maximizar uso de espacio.

## Fuentes de Datos
Todas las métricas provienen de consultas Prisma sobre las tablas `Order`, `OrderItem`, `User`. No se usan agregados materializados todavía.

| Helper | Salida | Uso en UI |
|--------|-------|----------|
| `getSummaryMetrics` | Totales: revenue, orders, aov, units, usuarios (nuevos, buyers, repeat), cancelados | Tarjetas KPI, UpdateCard |
| `getTimeSeries` | Serie temporal revenue/orders/units | RevenueOrdersChart, RevenueUnitsBarChart, CumulativeRevenueChart |
| `getUserSeries` | Nuevos usuarios por bucket | UserGrowthChart |
| `getTopProducts` | Top N por ingresos | TopProductsBarChart / tabla |
| `getCategoryDistribution` | Ingresos/unidades por categoría | Dona categorías |
| `getOrderStatusBreakdown` | Conteos por status por bucket | OrderStatusChart (stacked) |
| `getOrderStatusTotals` | Resumen global status | StatusRadial |

## Rango y Comparación
- `normalizeRange` define from/to y granularidad (day/week/month).
- `previousRange` calcula el rango anterior adyacente para deltas.
- Si el periodo previo no tiene datos la delta se marca como `Nuevo`.

## Componentes UI Clave
- `RevenueOrdersChart`: toggle line (ingresos/pedidos).
- `RevenueUnitsBarChart`: barras comparativas (doble eje Y).
- `CumulativeRevenueChart`: área acumulada.
- `CancelRateChart`: línea % cancelados.
- `UserGrowthChart`: área nuevos usuarios.
- `CategoryDistribution`: dona top categorías con leyenda adaptable.
- `OrderStatusChart`: stacked area estados.
- `TopProductsBarChart`: barras horizontales (Top 8 ingresos).
- `StatusRadial`: radial simple de composición de estados.
- `DenseModeToggle`: alterna clase `dense-mode` en `<html>`.
- `UpdateCard`: Variación de ingresos vs periodo previo.

## Responsividad
Estrategias:
1. Grids adaptativos (col-span variables en xl / 2xl, stack en mobile).
2. Alturas mayores en mobile para charts densos (`h-[340px]`).
3. ResizeObserver en pie y charts clave para ajustar radios, márgenes y ejes según ancho real.
4. En modo denso se reduce padding, se ocultan leyendas y se disminuye la altura.

## Modo Denso
Activado mediante botón (`DenseModeToggle`):
- Clase `dense-mode` añade reglas en `globals.css`.
- Reduce alturas mínimas, padding, tamaños de fuente y oculta leyendas para mayor densidad.

## Accesibilidad
- Títulos semánticos (`h2`, `aria-labelledby`).
- Tarjetas KPI con `title` y `aria-label` describiendo la métrica.
- Contraste controlado en tarjetas y radiales.

## Exportaciones
`ExportMenu` ofrece CSV de:
- Resumen (summary)
- Serie temporal
- Top productos
- Categorías
- Estados pedidos

(Extensible para cancel-rate y cumulative en futuras iteraciones.)

## Performance & Consideraciones
- Consultas en paralelo con `Promise.all`.
- Cálculos en memoria (agregación simple) – coste O(n) por pedidos en rango.
- Posible optimización futura: índices compuestos (status, createdAt) y vistas materializadas para agregados largos.

## Errores y Edge Cases
| Caso | Manejo Actual |
|------|---------------|
| Periodo sin datos | Series vacías -> gráficos muestran 0 / placeholder |
| Usuarios nuevos = 0 y prev >0 | Delta negativa (flecha roja) |
| Prev = 0 y actual >0 | Estado `Nuevo` 100% |
| División por cero | KPI muestra 0 y texto “Sin periodo previo comparable” |

## Permisos
Acceso al dashboard: `admin:access` o `dashboard:access`.
Acceso auditoría: `audit:read`.

## Próximas Mejoras Técnicas
- Guardar preferencia modo denso en localStorage.
- Cache de series (etag / revalidateTag).
- Dark mode con tema semántico.
- Materializar métricas históricas (tabla summary diaria).
- Sparklines en cada KPI.

## Testing Recomendado
- Unit tests de helpers (`getSummaryMetrics`, `getTimeSeries`) con datos mock.
- Snapshot de CSV generado (líneas esperadas).
- Prueba visual responsive (414px, 768px, 1280px, 1536px).

## Riesgos y Mitigaciones
| Riesgo | Mitigación |
|--------|-----------|
| Crecimiento de pedidos ralentiza agregación | Indexes + paginación en queries + vistas agregadas |
| Cambios de modelo rompen métricas | Tipado estricto + tests unitarios |
| Demasiadas visualizaciones afectan TTI | Lazy load condicional futuro / code splitting |

---
Última actualización: (mantener actualizado al modificar el panel).
