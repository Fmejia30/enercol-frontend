# Tokens de diseño

Fuente única: `src/styles/globals.css`.

Las variables de `:root` guardan la marca y el tema claro. `[data-theme="dark"]` sustituye solo los tokens semánticos. `@theme inline` los expone como utilidades de Tailwind (`bg-energy`, `text-muted`, `rounded-md`). Los componentes consumen utilidades, no hexadecimales sueltos.

## Color

Cada token de color de interfaz tiene una utilidad del mismo nombre.

| Variable | Utilidad | Valor |
| --- | --- | --- |
| `--navy` | `bg-navy`, `text-navy` | `#101C31` |
| `--energy` | `bg-energy` | `#194B91` en claro, `#7CB7E8` en oscuro |
| `--on-energy` | `text-on-energy` | `#FFFFFF` en claro, `#17191D` en oscuro |
| `--energy-text` | `text-energy-text`, `ring-energy-text` | `#194B91` en claro, `#7CB7E8` en oscuro |
| `--energy-hover` | `bg-energy-hover` | `#153F7A` en claro, `#91C5ED` en oscuro |
| `--energy-active` | `bg-energy-active` | `#123665` en claro, `#5D9FD2` en oscuro |
| `--cyan` | `bg-cyan`, `text-cyan`, `border-cyan` | `#69BAF2` |
| `--cloud` | `bg-cloud` | `#EDF4FF` |
| `--background` | `bg-background` | `#F3F5F9` en claro, `#17191D` en oscuro |
| `--foreground` | `text-foreground` | `#263449` en claro, `#E7E9ED` en oscuro |
| `--surface` | `bg-surface` | `#FFFFFF` en claro, `#202329` en oscuro |
| `--elevated` | `bg-elevated` | `#FFFFFF` en claro, `#30353D` en oscuro |
| `--sunken` | `bg-sunken` | `#EDF1F7` en claro, `#292D34` en oscuro |
| `--accent-soft` | `bg-accent-soft` | `#EDF1F7` en claro, `#263746` en oscuro |
| `--muted` | `text-muted` | `#66758A` en claro, `#A0A7B2` en oscuro |
| `--subtle` | `text-subtle`, `placeholder:text-subtle` | `#66758A` en claro, `#A0A7B2` en oscuro |
| `--navy-muted` | `text-navy-muted` | `#A9B9CE` |
| `--navy-faint` | `text-navy-faint` | `#8FA4BC` |
| `--border` | `border-border` | `#DCE3ED` en claro, `#7A7E85` en oscuro |
| `--border-strong` | `border-border-strong` | `#C5D0E0` en claro, `#8E939B` en oscuro |
| `--line` | `border-line` | `#DCE3ED` en claro, `#7A7E85` en oscuro |
| `--destructive` | `text-destructive`, `border-destructive` | `#B42318` en claro, `#F0B4B4` en oscuro |
| `--destructive-fill` | `bg-destructive-fill` | `#B42318` |
| `--destructive-fill-hover` | `bg-destructive-fill-hover` | `#912018` |
| `--destructive-surface` | `bg-destructive-surface` | `#FDECEC` en claro, `#3A2222` en oscuro |
| `--success` | `text-success` | `#067647` en claro, `#7DCEA0` en oscuro |
| `--success-surface` | `bg-success-surface` | `#E7F6EF` en claro, `#143028` en oscuro |
| `--warning` | `text-warning` | `#B54708` en claro, `#E8B86D` en oscuro |
| `--warning-surface` | `bg-warning-surface` | `#FDF4E7` en claro, `#3A2E16` en oscuro |
| `--draft` | `text-draft` | `#263449` en claro, `#E7E9ED` en oscuro |
| `--draft-surface` | `bg-draft-surface` | `#EDF1F7` en claro, `#292D34` en oscuro |
| `--info-surface` | `bg-info-surface` | `#E6F2FC` en claro, `#263746` en oscuro |
| `--disabled` | `bg-disabled` | `#EDF1F7` en claro, `#292D34` en oscuro |
| `--disabled-foreground` | `text-disabled-foreground` | `#66758A` en claro, `#A0A7B2` en oscuro |
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
