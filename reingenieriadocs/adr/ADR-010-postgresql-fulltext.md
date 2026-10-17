# ADR-010: Búsqueda con PostgreSQL Full-Text

## Contexto
Se necesita una búsqueda simple y rápida sin introducir un motor externo.

## Decisión
Usar **PostgreSQL Full-Text Search** para el catálogo.

## Consecuencias
- Búsqueda eficiente sin servicios adicionales.
- Posibles límites para búsquedas avanzadas.
