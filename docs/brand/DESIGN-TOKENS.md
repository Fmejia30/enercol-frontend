# Tokens de diseño

Fuente única: `src/styles/globals.css`.

Las variables de `:root` guardan la marca y el tema claro. `[data-theme="dark"]` sustituye solo los tokens semánticos. `@theme inline` los expone como utilidades de Tailwind (`bg-energy`, `text-muted`, `rounded-md`). Los componentes consumen utilidades, no hexadecimales sueltos.

## Color

Cada token de color de interfaz tiene una utilidad del mismo nombre.

| Variable | Utilidad | Valor |
| --- | --- | --- |
| `--navy` | `bg-navy`, `text-navy` | `#1C1D2C` |
| `--energy` | `bg-energy` | `#005490` |
| `--energy-text` | `text-energy-text`, `ring-energy-text` | `#005490` en claro, `#7EB6DE` en oscuro |
| `--energy-hover` | `bg-energy-hover` | `#004577` |
| `--energy-active` | `bg-energy-active` | `#003E68` |
| `--cyan` | `bg-cyan`, `text-cyan`, `border-cyan` | `#00B0F0` |
| `--cloud` | `bg-cloud` | `#F5F7FA` |
| `--background` | `bg-background` | `#F5F7FA` |
| `--foreground` | `text-foreground` | `#1C1D2C` |
| `--surface` | `bg-surface` | `#FFFFFF` |
| `--sunken` | `bg-sunken` | `#EEF2F6` |
| `--muted` | `text-muted` | `#4E5668` |
| `--subtle` | `text-subtle`, `placeholder:text-subtle` | `#5C6478` |
| `--navy-muted` | `text-navy-muted` | `#C5CDD8` |
| `--navy-faint` | `text-navy-faint` | `#9AA6B8` |
| `--border` | `border-border` | `#7B899C` |
| `--border-strong` | `border-border-strong` | `#5C6A7C` |
| `--line` | `border-line` | `#D5DCE4` |
| `--destructive` | `text-destructive`, `border-destructive` | `#9F2D2D` en claro, `#E8B4B4` en oscuro |
| `--destructive-fill` | `bg-destructive-fill` | `#9F2D2D` |
| `--destructive-fill-hover` | `bg-destructive-fill-hover` | `#7A1E1E` |
| `--destructive-surface` | `bg-destructive-surface` | `#F8EEEE` |
| `--info-surface` | `bg-info-surface` | `#E7F0F7` |
| `--disabled` | `bg-disabled` | `#E4E9EF` |
| `--disabled-foreground` | `text-disabled-foreground` | `#4E5668` |
| `--on-solid` | `text-on-solid` | `#FFFFFF` |

El significado de cada color está en [COLOR-SYSTEM.md](./COLOR-SYSTEM.md).

## Tipografía

| Variable | Valor |
| --- | --- |
| `--font-sans` | `"Nunito Sans Variable", "Nunito Sans", ui-sans-serif, system-ui, sans-serif` |

La utilidad es `font-sans`. El cuerpo ya la hereda. La escala de tamaños está en [TYPOGRAPHY.md](./TYPOGRAPHY.md).

## Espaciado

Se usa la escala de 4 px de Tailwind. No hay una segunda escala paralela.

| Paso | Valor | Uso habitual |
| --- | --- | --- |
| 1 | 4 px | Ajuste fino de iconos |
| 2 | 8 px | Etiqueta y campo |
| 3 | 12 px | Padding interno de alertas |
| 4 | 16 px | Separación corta |
| 5 | 20 px | Entre campos del formulario. Padding móvil |
| 6 | 24 px | Bloque interno |
| 8 | 32 px | Título del formulario y campos |
| 10 | 40 px | Respiro antes del diagrama |
| 10–12 | 40–48 px | Padding del panel en escritorio |
| 14 | 56 px | Padding amplio del formulario |

## Radio

| Token | Valor | Utilidad | Uso |
| --- | --- | --- | --- |
| `--radius-sm` | 4 px | `rounded-sm` | Badges |
| `--radius-md` | 8 px | `rounded-md` | Botones y campos |
| `--radius-lg` | 12 px | `rounded-lg` | Alertas y tarjetas |

Los controles no son píldoras. `rounded-full` queda reservado a un punto de 6 px, no a botones.

## Sombra

Las utilidades `shadow-xs`, `shadow-sm` y `shadow-md` leen `--elevation-xs`, `--elevation-sm` y `--elevation-md`. El tema oscuro aumenta la opacidad para que la separación siga visible sobre Midnight Navy.

El inicio de sesión no usa sombra. El formulario se apoya en el fondo, no en una tarjeta elevada. La sombra no sustituye el borde de un campo. El panel móvil de navegación usa `shadow-md`.

## Movimiento

| Elemento | Duración | Curva | Reducción de movimiento |
| --- | --- | --- | --- |
| Color de botón y campo | 150 ms | `ease` de Tailwind | Se anula con `motion-reduce:transition-none` |
| Circuito del diagrama | 5.5 s, lineal, continua | lineal | El trazo animado se oculta y queda la línea cian sólida |
| Indicador de carga | giro continuo | lineal | El arco queda estático. El texto «Verificando» permanece |

No hay entradas con desplazamiento ni rebotes. Una animación nueva tiene que poder desactivarse con `prefers-reduced-motion`.

## Altura de viewport

`short` aplica por debajo de 800 px de alto y `compact` por debajo de 640 px. Reducen márgenes y, en el panel de identidad, ocultan primero el texto de apoyo y después el diagrama. El contenido que queda siempre puede desplazarse.

## Z-index

El enlace «Saltar al formulario de acceso» usa `z-50` solo mientras tiene foco. El panel de navegación móvil usa `z-40`. No se apilan capas decorativas.

## Clases de composición

| Clase | Dónde | Qué hace |
| --- | --- | --- |
| `.identity-surface` | Panel de marca | Navy, retícula y radial |
| `.energy-track` | Diagrama | Circuito cian en reposo |
| `.energy-circuit` | Diagrama | Segmento que recorre el circuito |

Esas tres clases no se reutilizan para otros componentes.

## Regla de uso

Un componente nuevo toma color, radio, sombra y tipo de estos tokens. Si el diseño pide un valor que no existe, se añade aquí y en `globals.css` antes de usarlo en un archivo de interfaz.
