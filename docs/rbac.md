# RBAC (Roles & Permisos)

Documento alineado con el seed actual (`prisma/seed-rbac.ts`).

## Objetivos
- Separación clara de capacidades (lectura dashboard vs administración CRUD).
- Extensibilidad: agregar nuevos permisos sin refactor masivo.
- Migración suave desde usuarios legado con enum `role='ADMIN'`.

## Entidades (Modelo)
| Entidad | Propósito |
|---------|-----------|
| `Permission` | Catálogo de permisos (campo `key` único). |
| `RoleEntity` | Rol lógico (nombre + label). |
| `RolePermission` | Relación N:M rol ↔ permiso. |
| `UserRole` | Relación N:M usuario ↔ rol. |

## Permisos Definidos (seed)
| Key | Descripción |
|-----|------------|
| admin:access | Acceso general al panel admin. Gate principal. |
| dashboard:access | Acceso lectura al dashboard analítico. |
| product:read | Listar / ver productos. |
| product:create | Crear productos. |
| product:update | Editar productos. |
| product:delete | Eliminar productos. |
| category:read | Listar / ver categorías. |
| category:create | Crear categoría. |
| category:update | Editar categoría. |
| category:delete | Eliminar categoría. |
| order:read | Ver pedidos. |
| order:manageStatus | Cambiar estado de pedido (fulfillment). |
| user:read | Ver usuarios. |
| user:create | Crear usuario (interno). |
| user:update | Editar usuario. |
| user:delete | Eliminar usuario. |
| role:read | Ver roles / listado. |
| role:update | Modificar permisos de roles. |

> Si añades nuevas features usar convención `recurso:acción` (p.ej. `audit:read`, `metrics:export`).

## Roles Sembrados
| Rol | Permisos (resumen) |
|-----|--------------------|
| admin | TODOS los permisos. |
| manager | admin:access, dashboard:access, CRUD productos/categorías, order:read, order:manageStatus. |
| support | Lectura: productos, categorías, pedidos. |
| viewer | Lectura: productos, categorías. |

## Flujo del Seed
1. Upsert de cada permiso.
2. Upsert de roles.
3. Limpieza de `RolePermission` y recreación desde arrays.
4. Asignación de rol `admin` a usuarios legado con `role='ADMIN'`.

## Resolución de Permisos en Runtime
Helper (ej. `getUserPermissions`) reúne todos los permisos de los roles de un usuario y retorna un `Set<string>` para consultas O(1):
```ts
const perms = await getUserPermissions(user.id);
if (!(perms.has('admin:access') || perms.has('dashboard:access'))) return 403;
```
Evitar chequear por nombre de rol (fragilidad). Siempre comparar permisos.

## Ejemplos de Autorización
| Caso | Condición |
|------|-----------|
| Ver dashboard | `admin:access` OR `dashboard:access` |
| Editar producto | `product:update` |
| Cambiar estado pedido | `order:manageStatus` |
| Administrar roles | `role:update` |

## Auditoría & RBAC
- Acciones sensibles deben registrar evento en `AuditLog` (ej: `product.update`, `role.update`).
- Para futuras restricciones de lectura de auditoría añadir `audit:read` (no presente en seed actual — documentado como candidato).

## Mejores Prácticas
| Práctica | Razón |
|----------|-------|
| Permisos atómicos | Evita sobre-permisos globales. |
| Nombres consistentes | Facilita grep y refactors. |
| No confiar sólo en UI | Validar siempre en servidor. |
| Revisión periódica | Detectar permisos huérfanos / no usados. |

## Extensiones Futuras
| Mejora | Descripción | Valor |
|--------|-------------|-------|
| `audit:read` / `audit:export` | Control granular de logs | Seguridad / compliance |
| `metrics:export` | Limitar export masivo de datos | Protección datos |
| Caché in-memory permisos | Cachear Set por userId con TTL | Menos queries Prisma |
| Versionado permisos | Campo `schemaVersion` para migraciones | Trazabilidad |
| Tiempo de vida (TTL) | Permisos temporales (soporte) | Control fino |

## Añadir un Nuevo Permiso
1. Agregar key en array `PERMISSIONS` del seed.
2. Añadir key en roles correspondientes.
3. Ejecutar seed (o script de migración segura en prod).
4. Usar `perms.has('nuevo:permiso')` en rutas / componentes server.

---
Última actualización: mantener sincronizado tras cualquier cambio en `seed-rbac.ts`.
