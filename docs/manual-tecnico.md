# Manual técnico

## Componentes principales
- HTML: `index.html`
- CSS: `css/styles.css`
- JS: `js/main.js`

## Componentes
### Estructura
- UI semántica con secciones: `header` (marca + navegación), `hero`, productos, sobre nosotros, contacto, `footer`.
- Modal accesible para detalle de producto.
- Formulario de contacto con validación de campos e indicador de feedback.

### Navegación
- Menú principal con enlaces internos (anclas) y botón “hamburger” que alterna visibilidad en móvil.
- Atributos WAI‑ARIA: `aria-expanded`, `aria-controls`.

### Productos
- Cards de producto con `data-title` y `data-desc` para texto y descripciones.
- Botones “Ver” y “Comprar” (este último simula acción con alerta).

## Modal de producto
- Ventana modal con título, descripción y acciones (Comprar/Cerrar).
- Controlada por funciones JS: `openModal` y `closeModal`.

## Contacto
- Formulario con campos de texto, email, teléfono (pattern), select de departamento, dirección, mensaje, checkbox de consentimiento, y adjunto opcional de imagen.
- Manejo de nombre de archivo adjunto y validación adicional en cliente.
- Envío simulado y persistencia en `localStorage` bajo la clave `cm_submissions`.

## Estilos
### Design tokens
- Variables CSS en `:root` (colores, sombras, radios, tipografía).
- Reset básico y `scroll-behavior: smooth`.

### Layout
- Header sticky con `backdrop-filter` y borde translúcido.
- Hero con gradiente, contenido en columnas, y CTA.
- Grid de productos (`display: grid`) con 3 columnas, responsivo a 2 y 1 columna según breakpoints.
- Cards con `box-shadow`, `hover` elevación, y tamaños de imagen controlados vía `.product-photo` y overrides por producto.
- Modal centrado con overlay semitransparente.
- Formulario con filas, controles estilizados, etiqueta de archivo y feedback.

### Responsivo
- Breakpoints a 900px y 640px.
- En móvil: ocultar `.main-nav`, mostrar `.nav-toggle`, ajustar grillas y fotos.

## Ejecución de JavaScript
### Punto de entrada
- `DOMContentLoaded`.

### Inicializaciones
- Año dinámico en footer.
- Referencias a elementos de modal y wiring de eventos (click en botones de cierre y en backdrop).
- Click en `.product-item`: abre modal con datos de `data-title`/`data-desc`.
- Botones “ver”/“comprar” detienen propagación; “ver” abre modal; “comprar” muestra alerta.
- “Comprar” en modal simula checkout y cierra.
- Búsqueda: filtra `.product-item` por coincidencia en título/desc/texto.
- Toggle de navegación en móvil: alterna `display` en `.main-nav` y `aria-expanded` en el botón.

### Formulario
- Muestra nombre y tamaño del archivo adjunto.
- Validación básica de campos obligatorios y consentimiento.
- Persistencia: agrega un objeto de envío al arreglo `cm_submissions` en `localStorage`.
- Feedback de éxito y `reset` del formulario.

### Funciones principales
- `openModal`: establece contenido en título/desc, marca `aria-hidden="false"` y bloquea scroll de `body`.
- `closeModal`: marca `aria-hidden="true"` y restablece scroll.

## Estructura semántica
- Doctype HTML5, `lang` correcto y metadatos básicos.
- Head: title, meta descripción, viewport, favicon, Open Graph.
- Carga de recursos: `rel="preload"` cuando aplique, CSS en `<head>`, JS con `defer`.
- Estructura: `<header>`, `<nav>`, `<main>`, secciones con `<section>` y encabezados jerárquicos `<h1..h3>`, `<footer>`.
- Enlaces internos con anclas y “skip link” para accesibilidad.
