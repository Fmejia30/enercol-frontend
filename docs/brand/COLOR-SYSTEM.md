# Sistema de color

Los cuatro colores de marca son fijos. El resto de la paleta existe para que el texto, los bordes y los estados cumplan contraste sin improvisar hexadecimales en los componentes.

Implementación: variables en `:root` para la marca y el tema claro, y en `[data-theme="dark"]` para el tema oscuro. Las utilidades de Tailwind viven en `src/styles/globals.css`. La apariencia se elige entre claro, oscuro y sistema.

## Colores de marca

| Nombre | Hex | Token | Función |
| --- | --- | --- | --- |
| Midnight Navy | `#1C1D2C` | `--navy` | Superficie de identidad y color de texto principal |
| Energy Blue | `#005490` | `--energy` | Acción primaria, enlaces y foco sobre fondo claro |
| Electric Cyan | `#00B0F0` | `--cyan` | Señal viva. Solo sobre Midnight Navy |
| Cloud White | `#F5F7FA` | `--cloud` | Fondo de la aplicación |

En tema claro, Midnight Navy y el texto principal (`--foreground`) coinciden. En tema oscuro el texto principal pasa a Cloud White y Midnight Navy queda como superficie, no como color de texto.

## Contraste

Medido como relación WCAG. El objetivo de la interfaz es AA (4.5:1 para texto normal, 3:1 para componentes y texto grande).

| Par | Relación | Uso permitido |
| --- | --- | --- |
| `#FFFFFF` sobre `#005490` | 7.86:1 | Etiqueta de botón primario |
| `#F5F7FA` sobre `#1C1D2C` | 15.51:1 | Texto principal sobre navy |
| `#FFFFFF` sobre `#1C1D2C` | 16.65:1 | Texto de marca sobre navy |
| `#005490` sobre `#F5F7FA` | 7.33:1 | Texto y enlaces sobre el fondo |
| `#00B0F0` sobre `#1C1D2C` | 6.71:1 | Texto de acento, índices y señal sobre navy |
| `#00B0F0` sobre `#F5F7FA` | 2.31:1 | No usar para texto ni para anillos de foco |
| `#00B0F0` sobre `#FFFFFF` | 2.48:1 | No usar para texto ni para bordes de control |
| `#4E5668` sobre `#F5F7FA` | 6.85:1 | Texto secundario |
| `#5C6478` sobre `#F5F7FA` | 5.51:1 | Placeholders y notas |
| `#C5CDD8` sobre `#1C1D2C` | 10.38:1 | Texto secundario sobre navy |
| `#9AA6B8` sobre `#1C1D2C` | 6.75:1 | Pies y etiquetas del diagrama |
| `#9F2D2D` sobre `#FFFFFF` | 7.27:1 | Mensaje de error en claro y etiqueta del botón destructivo |
| `#9F2D2D` sobre `#F8EEEE` | 6.39:1 | Título de alerta de error en claro |
| `#7EB6DE` sobre `#101118` | 8.64:1 | Texto de acento en oscuro |
| `#7EB6DE` sobre `#1C1D2C` | 7.63:1 | Enlace y anillo de foco sobre superficie oscura |
| `#7EB6DE` sobre `#15283A` | 6.90:1 | Título de alerta informativa en oscuro |
| `#E8B4B4` sobre `#101118` | 9.08:1 | Mensaje de error en oscuro |
| `#E8B4B4` sobre `#3A2222` | 8.11:1 | Título de alerta de error en oscuro |
| `#9F2D2D` con texto `#FFFFFF` | 7.27:1 | Botón destructivo, en ambos temas |
| `#6E7E98` sobre `#1C1D2C` | 4.57:1 | Borde de control en oscuro |
| `#6E7E98` sobre `#101118` | 4.04:1 | Borde de control contra la página oscura |
| `#7B899C` sobre `#FFFFFF` | 3.56:1 | Borde de campo |
| `#7B899C` sobre `#F5F7FA` | 3.32:1 | Borde de campo contra la página |

## Tokens semánticos

### Superficies

| Token | Hex | Uso |
| --- | --- | --- |
| `--background` | `#F5F7FA` | Página |
| `--surface` | `#FFFFFF` | Campos, tarjetas y botón secundario |
| `--sunken` | `#EEF2F6` | Hover del botón secundario y campo deshabilitado |
| `--info-surface` | `#E7F0F7` | Fondo de mensaje informativo |
| `--destructive-surface` | `#F8EEEE` | Fondo de mensaje de error |
| `--disabled` | `#E4E9EF` | Fondo de botón deshabilitado |
| `--navy` | `#1C1D2C` | Panel de identidad |

### Texto

| Token | Hex | Uso |
| --- | --- | --- |
| `--foreground` | `#1C1D2C` | Texto principal sobre claro |
| `--muted` | `#4E5668` | Texto de apoyo |
| `--subtle` | `#5C6478` | Placeholder |
| `--navy-muted` | `#C5CDD8` | Párrafos sobre navy |
| `--navy-faint` | `#9AA6B8` | Metadatos sobre navy |
| `--disabled-foreground` | `#4E5668` | Etiqueta de control deshabilitado |
| `--on-solid` | `#FFFFFF` | Texto sobre Energy Blue o sobre el color de error |

### Líneas

| Token | Hex | Uso |
| --- | --- | --- |
| `--border` | `#7B899C` | Contorno de campos y botones secundarios. Cumple 3:1 |
| `--border-strong` | `#5C6A7C` | Hover del campo |
| `--line` | `#D5DCE4` | Divisiones de tarjeta. No identifica un control |

`--line` es una separación visual, no el borde de un campo. Un input no debe usar este token.

### Acción y estado

| Token | Hex | Uso |
| --- | --- | --- |
| `--energy` | `#005490` | Relleno del botón primario. No cambia con el tema |
| `--energy-hover` | `#004577` | Hover del primario |
| `--energy-active` | `#003E68` | Active del primario |
| `--energy-text` | `#005490` en claro, `#7EB6DE` en oscuro | Texto de acento, anillo de foco y borde informativo |
| `--cyan` | `#00B0F0` | Señal sobre navy: circuito, índice, filete |
| `--destructive` | `#9F2D2D` en claro, `#E8B4B4` en oscuro | Texto y borde de error |
| `--destructive-fill` | `#9F2D2D` | Relleno del botón destructivo |
| `--destructive-fill-hover` | `#7A1E1E` | Hover del botón destructivo |

No hay token de éxito en esta fase. El aviso posterior a la validación local es informativo, no una confirmación de sesión.

## Reglas de Electric Cyan

El cian se usa solo cuando el fondo inmediato es Midnight Navy:

- Derivación viva del signo en tono inverse.
- Índices `01`, `02`, `03`.
- Ceja «Sistema eléctrico».
- Filete de 2 px entre el panel y el formulario.
- Circuito principal del diagrama unifilar.
- Trazo de 32 px antes del pie «Sector eléctrico colombiano».

No se usa para texto de cuerpo, placeholders, bordes de input, anillos de foco ni botones sobre Cloud White. En superficies claras, el acento es Energy Blue.

## Foco

El anillo de foco usa `--energy-text`, 2 px, con separación de 2 px. En claro coincide con Energy Blue. En oscuro usa `#7EB6DE`, porque `#005490` sobre Midnight Navy queda cerca de 2.1:1 y no alcanza el contraste de un componente. Sobre el panel navy no hay controles. Si más adelante hay controles sobre navy, el anillo puede ser Electric Cyan.

## Tema oscuro

El tema oscuro no invierte la paleta. Los colores de marca permanecen. Cambian las superficies, el texto, los bordes y los estados.

| Token | Hex | Uso |
| --- | --- | --- |
| `--background` | `#101118` | Página, un paso por debajo de Midnight Navy |
| `--surface` | `#1C1D2C` | Campos, tarjetas, barra y navegación |
| `--sunken` | `#16171F` | Hover y campo deshabilitado |
| `--foreground` | `#F5F7FA` | Texto principal |
| `--muted` | `#B7C0CE` | Texto de apoyo |
| `--subtle` | `#9AA6B8` | Placeholder y notas |
| `--border` | `#6E7E98` | Contorno de controles |
| `--border-strong` | `#8AA0B8` | Hover del campo |
| `--line` | `#5C6B84` | Divisiones internas |
| `--info-surface` | `#15283A` | Alerta informativa |
| `--destructive-surface` | `#3A2222` | Alerta de error |
| `--disabled` | `#2A3144` | Fondo de botón deshabilitado |
| `--disabled-foreground` | `#9AA6B8` | Etiqueta deshabilitada |

El panel de identidad sigue en Midnight Navy con señal cian en ambos temas. La página oscura (`#101118`) y ese panel se distinguen por el filete cian y por el paso de superficie.

Energy Blue `#005490` se reserva al relleno de botones con texto blanco. Texto, foco, botones fantasma y bordes informativos usan `--energy-text`.

## Fondos del panel de identidad

El panel combina tres capas, en este orden:

1. Midnight Navy sólido.
2. Retícula de 52 px al 4.5 % de Cloud White.
3. En escritorio, un radial de Energy Blue al 48 %, anclado abajo a la izquierda, detrás del diagrama. En pantallas menores no se usa, para que la cabecera compacta permanezca plana.

No se añaden más gradientes, texturas ni fotografías.
