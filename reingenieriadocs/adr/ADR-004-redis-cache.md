# ADR-004: Uso de Redis para caché y sesiones

## Contexto
Se necesita reducir latencia en catálogo y manejar sesiones de forma eficiente.

## Decisión
Incorporar **Redis** para caché de catálogo y almacenamiento de sesiones.

## Consecuencias
- Mejor performance en lectura.
- Mayor complejidad operativa mínima.
