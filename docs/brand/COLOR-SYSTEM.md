# Sistema de color

La interfaz usa Royal Blue, Sky Cyan y un navy profundo. El texto, los bordes y los estados se resuelven con tokens para cumplir contraste sin improvisar hexadecimales en los componentes.

Implementación: variables en `:root` para la marca y el tema claro, y en `[data-theme="dark"]` para el tema oscuro. Las utilidades de Tailwind viven en `src/styles/globals.css`. La apariencia se elige entre claro, oscuro y sistema. La preferencia sigue en `enercol-theme`.

## Colores de marca

| Nombre | Hex | Token | Función |
| --- | --- | --- | --- |
| Institutional Navy | `#101C31` | `--navy` | Panel de identidad y marca en ambos temas |
| Sky Cyan | `#69BAF2` | `--cyan` | Señal sobre el panel de identidad |
| Royal Blue | `#194B91` | `--energy` | Acción primaria en el tema claro. Texto blanco |
| Soft Blue | `#7CB7E8` | `--energy` | Acción primaria en el tema oscuro. Texto `#17191D` |
| Texto de acción | `#194B91` | `--energy-text` | Enlaces y foco sobre fondo claro |
| Cloud | `#EDF4FF` | `--cloud` | Marca sobre el panel de identidad |
| Fondo | `#F3F5F9` | `--background` | Fondo de la aplicación en claro |
| Tinta | `#263449` | `--foreground` | Texto principal en claro |
| Apoyo | `#66758A` | `--muted` | Texto secundario en claro |
| Divisor | `#DCE3ED` | `--line`, `--border` | Separadores y borde de campo |

## Contraste

Medido como relación WCAG. El objetivo es AA: 4.5:1 para texto normal y 3:1 para componentes.

| Par | Relación | Uso permitido |
| --- | --- | --- |
| `#FFFFFF` sobre `#194B91` | 8.55:1 | Etiqueta del botón primario en claro |
| `#17191D` sobre `#7CB7E8` | 8.21:1 | Etiqueta del botón primario en oscuro |
| `#263449` sobre `#F3F5F9` | 11.52:1 | Texto principal |
| `#194B91` sobre `#F3F5F9` | 7.83:1 | Enlaces y anillo de foco |
| `#EDF4FF` sobre `#101C31` | 15.40:1 | Marca sobre el panel de identidad |
| `#69BAF2` sobre `#101C31` | 8.04:1 | Señal sobre navy |
| `#7CB7E8` sobre `#17191D` | 8.21:1 | Enlace y foco en oscuro |
| `#A0A7B2` sobre `#202329` | 6.50:1 | Texto secundario en oscuro |
| `#E7E9ED` sobre `#17191D` | 14.48:1 | Texto principal en oscuro |

## Tema oscuro

El tema oscuro no invierte el claro. El fondo es grafito neutro, las superficies son grises y el acento azul se reserva a la acción.

| Token | Hex |
| --- | --- |
| `--background` | `#17191D` |
| `--surface` | `#202329` |
| `--sunken` | `#292D34` |
| `--elevated` | `#30353D` |
| `--accent-soft` | `#263746` |
| `--foreground` | `#E7E9ED` |
| `--muted` | `#A0A7B2` |
| `--energy` | `#7CB7E8` |
| `--energy-hover` | `#91C5ED` |
| `--energy-active` | `#5D9FD2` |
| `--energy-text` | `#7CB7E8` |
| `--border` | `#7A7E85` |
| `--line` | `#7A7E85` |

`#363C46` sobre `#202329` queda en 1.42:1, por debajo del 3:1 de un borde de control. El borde oscuro sube a `#7A7E85` (3.03:1 sobre la superficie elevada y 3.86:1 sobre la superficie principal) sin cambiar el matiz grafito. El panel de identidad permanece en `#101C31` con señal `#69BAF2` en ambos temas. El botón primario usa `#194B91` con texto blanco en claro y `#7CB7E8` con texto `#17191D` en oscuro.

## Señal sobre navy

`--cyan` se usa cuando el fondo inmediato es navy institucional: la derivación del signo, los índices del panel, el filete y el circuito del diagrama. Sobre Cloud o blanco, el acento de texto es `--energy-text`.
