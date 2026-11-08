# Tipografía

EnerCol usa una sola familia: **Nunito Sans**. Está autoalojada con `@fontsource-variable/nunito-sans` y se declara como `--font-sans`. No se carga una segunda fuente para números, etiquetas técnicas ni el diagrama.

`font-display: swap` viene del paquete de la fuente. El navegador descarga solo los rangos Unicode que necesita.

## Pesos

La fuente variable cubre de 200 a 1000. El sistema usa dos:

| Peso | Uso |
| --- | --- |
| 400 | Párrafos, descripciones, mensajes de apoyo |
| 600 | Títulos, etiquetas, botones, índices, cejas |

No se usan 200, 300, 500, 700 ni 800 en interfaz. Un peso nuevo se documenta aquí antes de entrar a un componente.

## Escala

La escala está en `rem` (16 px de raíz). El tracking negativo solo aparece en títulos, para compensar la curva de Nunito Sans sin cambiar de familia.

| Rol | Tamaño | Interlineado | Peso | Tracking | Ejemplo |
| --- | --- | --- | --- | --- | --- |
| Display | `3.15rem` en xl, `2.75rem` en lg | 1.12 | 600 | `-0.03em` | «Lectura técnica de la energía.» |
| Título de página | `2rem`, `1.75rem` bajo `sm` | 1.2 | 600 | `-0.03em` | «Iniciar sesión» |
| Sección | `1.5rem` | 1.3 | 600 | `-0.02em` | Título dentro de una tarjeta |
| Cuerpo | `1rem` | 1.6 | 400 | 0 | Texto de apoyo del formulario |
| Interfaz | `0.875rem` | 1.4 | 600 | 0 | Etiquetas, alertas, errores |
| Ceja | `0.75rem` | 1.4 | 600 | `0.16em` | «Sistema eléctrico», solo mayúsculas |

Los campos de formulario usan `1rem`. Un tamaño menor hace que iOS amplíe la página al enfocar.

## Mayúsculas

Las mayúsculas sostenidas se reservan a la ceja y a indicadores cortos como «404». Siempre van con tracking amplio y peso 600. Las etiquetas de campo van en oración: «Correo electrónico», no «CORREO ELECTRÓNICO».

## Alineación y medida

- Los títulos usan `text-balance` cuando ocupan más de una línea.
- Los párrafos de lectura no superan unos 36 caracteres por línea en el panel de identidad y 26 rem en el formulario.
- El texto de interfaz se alinea a la izquierda. No se justifica.
- Los índices `01` `02` `03` usan cifras tabulares.

## Color tipográfico

El color del texto sigue [COLOR-SYSTEM.md](./COLOR-SYSTEM.md). En particular:

- Texto principal sobre claro: `--foreground`.
- Texto de apoyo sobre claro: `--muted`.
- Placeholder: `--subtle`.
- Texto de acento sobre navy: `--cyan`.
- Electric Cyan no se usa como color de texto sobre Cloud White ni sobre blanco.

## Numerales y diagrama

Las etiquetas «Generación», «Barra» y «Demanda» del diagrama son Nunito Sans a 12 px y peso 600. Heredan la familia de la página. No se sustituyen por una monoespaciada.
