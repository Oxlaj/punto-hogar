# Metodología SCRUM — Reingeniería ConejoMalo

## 1. Resumen
Este documento formaliza la ejecución de la reingeniería de **ConejoMalo** bajo SCRUM. Incluye roles, ceremonias, artefactos, definición de listo (DoR), definición de hecho (DoD), plan de sprints con fechas, backlog priorizado, historias de usuario, tablero To‑Do, diagrama de Gantt, matriz de riesgos y evidencias.

---

## 2. Propósito del proyecto
**Reingenierizar** una plataforma e‑commerce (Pet Shop) desde un monolito acoplado hacia una arquitectura desacoplada, escalable y profesional, manteniendo el foco en tiempo récord.

---

## 3. Alcance (MVP)
**Incluye:** Auth, catálogo, carrito, checkout (simulado si no hay pasarela), órdenes, documentación técnica mínima.
**No incluye:** panel admin, migración de datos legacy, features avanzadas.

---

## 4. Roles y responsabilidades
- **Product Owner (PO):** define valor de negocio, prioriza backlog, acepta entregables.
- **Scrum Master (SM):** facilita ceremonias, elimina bloqueos, protege el sprint.
- **Development Team (Dev):** 2 personas, entrega el incremento.

---

## 5. Artefactos SCRUM
- **Product Backlog:** listado priorizado de funcionalidades.
- **Sprint Backlog:** historias seleccionadas para el sprint.
- **Incremento:** entregable funcional al final de cada sprint.

---

## 6. Ceremonias
- **Sprint Planning (2h):** selección de historias y objetivos.
- **Daily Scrum (15m):** avances, bloqueos, plan del día.
- **Sprint Review (1h):** demo del incremento.
- **Sprint Retrospective (1h):** mejora continua.

---

## 7. Definición de Ready (DoR)
Una historia entra a sprint si:
- Tiene criterios de aceptación claros.
- Está estimada (t‑shirt o puntos).
- Tiene dependencias identificadas.
- Está priorizada por el PO.

## 8. Definición de Done (DoD)
- Código compilando sin errores.
- Tests críticos pasan.
- Documentación mínima actualizada.
- Feature deployable.

---

## 9. Diagrama de Gantt (texto)
```
Leyenda: [Resp] A=Frontend  B=Backend/Infra  PO=Product Owner  SM=Scrum Master

Fase 1  Definición            ██████████  (2026-03-16 → 2026-03-29) [PO,SM,A,B]
  Dep: inicio del proyecto
  Hito: Alcance firmado + C4 + esquema de datos

Fase 2  Setup Infraestructura ██████████  (2026-03-30 → 2026-04-12) [B,A]
  Dep: Fase 1
  Hito: repos separados + Docker + CI/CD

Fase 3  Refactor Backend      ██████████  (2026-04-13 → 2026-04-26) [B]
  Dep: Fase 2
  Hito: controllers/services + repository pattern

Fase 4  Seguridad & Auth      ██████████  (2026-04-27 → 2026-05-10) [B,A]
  Dep: Fase 3
  Hito: auth integrada + RBAC + validaciones

Fase 5  Testing               █████       (2026-05-11 → 2026-05-17) [A,B]
  Dep: Fase 4
  Hito: unit/integration/E2E básicos

Fase 6  Optimizaciones        █████       (2026-05-18 → 2026-05-24) [B]
  Dep: Fase 5
  Hito: Redis + índices BD + caché

Fase 7  Documentación         █████       (2026-05-25 → 2026-05-31) [A,B,PO]
  Dep: Fase 6
  Hito: OpenAPI + ADR + guía de desarrollo

Fase 8  Deployment & Demo     █████       (2026-06-01 → 2026-06-07) [B,A,PO]
  Dep: Fase 7
  Hito: deploy + demo final + lecciones aprendidas
```

---

## 10. Plan de Sprints (alineado al cronograma)
**Inicio previsto:** lunes **2026‑03‑16** (mediados de marzo). Sprints de 2 semanas.

### Sprint 1 (2026‑03‑16 → 2026‑03‑29) — Fase 1: Definición
**Objetivo:** documentación y arquitectura base.
**Entregables:**
- Documento de alcance
- Diagrama C4 (nivel 1–3)
- Esquema de datos mejorado

### Sprint 2 (2026‑03‑30 → 2026‑04‑12) — Fase 2: Setup Infraestructura
**Objetivo:** habilitar entorno y separación técnica.
**Entregables:**
- Repos separados (frontend/backend)
- Docker Compose
- CI/CD básico

### Sprint 3 (2026‑04‑13 → 2026‑04‑26) — Fase 3: Refactorización Backend
**Objetivo:** modularidad y persistencia robusta.
**Entregables:**
- Controllers implementados
- Services implementados
- Repository Pattern

### Sprint 4 (2026‑04‑27 → 2026‑05‑10) — Fase 4: Seguridad & Auth
**Objetivo:** seguridad mínima y autenticación.
**Entregables:**
- Auth integrada (JWT/Supabase/Auth0)
- RBAC implementado
- Validaciones

### Sprint 5 (2026‑05‑11 → 2026‑05‑17) — Fase 5: Testing
**Objetivo:** pruebas mínimas del flujo crítico.
**Entregables:**
- Tests unitarios (≈80% cobertura de módulos críticos)
- Tests de integración
- Tests E2E básicos

### Sprint 6 (2026‑05‑18 → 2026‑05‑24) — Fase 6: Optimizaciones
**Objetivo:** rendimiento básico.
**Entregables:**
- Redis implementado
- Índices de BD optimizados
- Caché estratégico

### Sprint 7 (2026‑05‑25 → 2026‑05‑31) — Fase 7: Documentación
**Objetivo:** documentación técnica completa.
**Entregables:**
- OpenAPI/Swagger
- Arquitectura (C4 + ADR)
- Guía de desarrollo

### Sprint 8 (2026‑06‑01 → 2026‑06‑07) — Fase 8: Deployment & Demo
**Objetivo:** despliegue y presentación final.
**Entregables:**
- Deploy productivo
- Demo
- Lecciones aprendidas

---

## 11. Backlog priorizado (alto nivel)
1. Separación Frontend/Backend
2. Arquitectura limpia (Clean/Hexagonal)
3. Persistencia con Repository Pattern
4. Auth segura (JWT + validaciones)
5. Catálogo + búsqueda
6. Carrito persistente
7. Checkout simulado
8. Órdenes
9. Testing integral
10. CI/CD básico
11. Observabilidad + logging
12. Documentación (API + C4 + ADR)

---

## 12. Historias de Usuario (con criterios de aceptación)

### HU‑01 Autenticación
**Como** usuario
**Quiero** iniciar sesión
**Para** acceder a mis órdenes

**Criterios de aceptación**
- Login devuelve JWT válido
- Error claro en credenciales inválidas

---

### HU‑02 Catálogo
**Como** usuario
**Quiero** ver productos por categoría
**Para** encontrar lo que necesito

**Criterios de aceptación**
- Lista filtrable por categoría
- Detalle de producto accesible

---

### HU‑03 Carrito persistente
**Como** usuario
**Quiero** guardar mi carrito
**Para** continuar luego

**Criterios de aceptación**
- Carrito persiste entre sesiones
- Agregar/eliminar productos funciona

---

### HU‑04 Checkout simulado
**Como** usuario
**Quiero** finalizar compra
**Para** generar una orden

**Criterios de aceptación**
- Confirmación crea una orden
- Mensaje de éxito visible

---

### HU‑05 Órdenes
**Como** usuario
**Quiero** ver mi historial de órdenes
**Para** revisar compras anteriores

**Criterios de aceptación**
- Lista de órdenes por usuario
- Detalle básico por orden

---

### HU‑06 Observabilidad mínima
**Como** equipo
**Quiero** logs y métricas
**Para** diagnosticar errores

**Criterios de aceptación**
- Logs con contexto
- Métricas básicas disponibles

---

## 13. Tablero To‑Do sugerido
**Columnas:**
- **Backlog**
- **To‑Do (Sprint)**
- **In Progress**
- **Review/QA**
- **Done**

**Política WIP:** máximo 2 ítems en “In Progress” por persona.

---

## 14. Matriz de riesgos y mitigaciones
| Riesgo | Impacto | Probabilidad | Mitigación |
|---|---|---|---|
| Retraso en setup de infraestructura | Alto | Medio | Definir plantillas base y usar Docker Compose desde el día 1. |
| Scope creep (incremento no planificado) | Alto | Medio | Congelar MVP y validar cambios con PO. |
| Dependencias externas (Auth/Deploy) | Medio | Medio | Tener proveedor alterno y fallback local. |
| Baja cobertura de tests | Medio | Alto | Enfocar tests en flujo crítico y módulos clave. |
| Problemas de rendimiento inicial | Medio | Medio | Índices en BD y caché con Redis desde Sprint 6. |
| Falta de claridad de requisitos | Alto | Medio | Refinement semanal y documentación de decisiones (ADR). |

---

## 15. Evidencias (estado actual)
**Repositorio:** Nelson-TC/conejomalo (único repo al momento).

**Guía de desarrollo:** carpeta `/docs` en la raíz del repositorio.

**Deploy activo:** https://conejomalo-r9ym.vercel.app/

**Pruebas:** aún no implementadas (según cronograma, fase 5 pendiente).

**Capturas del sistema en funcionamiento:**
- Home
  ![image4](image4)
- Catálogo
  ![image3](image3)
- Carrito
  ![image2](image2)
- Checkout
  ![image1](image1)
- Login
  ![image8](image8)
- Registro
  ![image7](image7)
- Historial de órdenes
  ![image6](image6)

---

## 16. Métricas de seguimiento
- Velocidad por sprint
- Cobertura de tests críticos
- Tiempo de ciclo
- Bugs post‑release
