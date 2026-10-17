# Dashboard UX & Interacción

Este documento complementa `arquitectura.md` describiendo las decisiones de experiencia de usuario adoptadas en el dashboard analítico.

## Objetivos de Diseño
- Proveer *insight first*: destacar concentración de ingresos y salud de pedidos rápidamente.
- Permitir ajuste de rango temporal sin fricción ni errores.
- Mantener legibilidad en breakpoints pequeños sin sacrificar contexto.
- Evitar parpadeos / recargas completas en interacciones frecuentes.
- Conservar accesibilidad (teclado y lectores) en widgets compactos.

## Controles de Fecha (DashboardFilters)
| Elemento | Decisión | Beneficio |
|----------|----------|-----------|
| Presets (7d, 30d, 90d, YTD) | Tooltips con descripción + auto detección de coincidencia | Reduce esfuerzo cognitivo |
| Estado local editable | No navega hasta pulsar "Aplicar" | evita errores por tecleo parcial |
| Validación (`from>to`, rango>365, fecha inválida) | Feedback inmediato textual | Menos estados inconsistentes en URL |
| Badge de días | Resumen rápido del rango | Contexto constante |
| Botón Reset | Limpia rango y preset | Recuperación rápida |
| `useTransition` spinner | Feedback sin bloqueo | Percepción de rapidez |

## Componentes Visuales
| Componente | UX Clave |
|------------|---------|
| Pareto Productos | Combina barras + línea cumulative para identificar umbral 80%. Badge final refuerza insight. |
| Dona Categorías Compacta | Click/Enter expande modal con detalle y leyenda; modo compacto minimiza ruido lateral. |
| OrderStatusChart | Márgenes, ticks y leyenda se adaptan al ancho; oculta elementos cuando el beneficio informativo cae. |
| StatusRadial | Resumen sintético de distribución final (estados) evitando saturar la stacked area. |
| DenseModeToggle | Permite a analistas maximizar densidad de datos en monitores grandes o móvil. |

## Accesibilidad
- Modal dona: cierra con ESC y botón visible. `role=button` + `tabIndex` en versión compacta.
- Botones de granularidad usan `aria-pressed`.
- Colores con contraste (evitado texto sobre fondos saturados sin suficiente contraste). Falta validación formal AA para algunos tonos secundarios.

## Estados Adaptativos
- `ResizeObserver` regula outer radius, márgenes y ejes para prevenir clipping.
- Ocultación condicional de leyenda / ejes prioriza mantener la forma de la serie antes que la redundancia textual.

## Errores & Prevención
- La antigua navegación inmediata en cada cambio de fecha provocaba rangos inconsistentes (solo `from` presente) → ahora se requiere Acción explícita.
- Se restringe a 365 días para evitar payloads pesados y distorsión de granularidad.

## Futuros Ajustes Propuestos
1. Auto-granularidad (cuando rango > 60 días → week; > 180 → month) con opción de override manual.
2. Persistir preferencias (dense mode, último rango) en `localStorage`.
3. Dark mode con paleta de gráficos ajustada (evitar saturación de naranja en bajo contraste).
4. Export adicional: Pareto y cancel rate en CSV.
5. Tooltips accesibles (navegables con teclado) usando `focus-visible`.
6. Animaciones suaves de apertura/cierre del modal (scale + fade) con `prefers-reduced-motion` respetado.

## Métricas de UX (para evaluar más adelante)
- Tiempo medio hasta primer insight (TTFI) medido por interacción con Pareto.
- % de cambios de rango que producen error (esperado → ~0 después de validación previa).
- Ratio de uso de modo denso vs normal.

---
Este documento se actualizará a medida que se introduzcan nuevas capas de interacción o se instrumenten métricas de comportamiento.
