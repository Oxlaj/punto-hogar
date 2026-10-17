export const CODE_MESSAGES: Record<string,string> = {
  UNAUTHENTICATED: 'No has iniciado sesión. Inicia sesión para continuar.',
  FORBIDDEN: 'No tienes permisos para realizar esta acción.',
  NAME_REQUIRED: 'El nombre es obligatorio.',
  MISSING_FIELDS: 'Faltan campos obligatorios.',
  INVALID_PRICE: 'El precio es inválido.',
  FILE_TOO_LARGE: 'El archivo supera el tamaño máximo (2MB).',
  INVALID_MIME: 'Tipo de archivo no permitido (usa JPG, PNG, WEBP, AVIF).',
  INVALID_EXT: 'Extensión de archivo no permitida.',
  UPLOAD_FAILED: 'No se pudo subir el archivo. Intenta nuevamente.',
  SERVER_ERROR: 'Error interno. Intenta más tarde.',
  NOT_FOUND: 'El recurso no existe o fue eliminado.',
  ACTIVE_PRODUCTS: 'No se puede eliminar la categoría porque tiene productos activos asociados.',
  INACTIVE_PRODUCTS: 'No se puede eliminar la categoría porque tiene productos inactivos asociados. Desactiva la categoría para conservarlos.',
  CATEGORY_IN_USE: 'No se puede eliminar la categoría porque conserva productos relacionados.',
  EMAIL_REQUIRED: 'El email es obligatorio.',
  SELF_ADMIN_DELETE: 'No puedes eliminar tu propio usuario administrador.',
  LAST_ADMIN_DELETE: 'No puedes eliminar al último administrador del sistema.',
  SELF_ADMIN_REVOKE: 'No puedes quitarte tu propio acceso administrativo.',
  LAST_ADMIN_REVOKE: 'No puedes revocar el último acceso administrativo del sistema.',
  ADMIN_ROLE_DELETE: 'No se puede eliminar el rol administrativo del sistema.',
  INVALID_PURCHASE: 'Los datos de la compra no son válidos.',
  INVALID_DATE: 'La fecha de compra no es válida.',
  DUPLICATE_PRODUCT: 'Un producto no puede repetirse en la compra.',
  PRODUCT_NOT_ASSOCIATED: 'El producto no está asociado al proveedor.',
  NON_INTEGER_CONVERSION: 'La conversión debe producir unidades enteras de inventario.',
  PURCHASE_ALREADY_RECEIVED: 'La compra ya fue recibida.',
  INVALID_CONVERSION: 'La conversión de inventario no es válida.',
};

export function mapApiError(data: any, fallback = 'Ocurrió un error') {
  if (!data) return fallback;
  if (data.code && CODE_MESSAGES[data.code]) return CODE_MESSAGES[data.code];
  if (typeof data.error === 'string') return data.error;
  if (typeof data.message === 'string') return data.message;
  return fallback;
}
