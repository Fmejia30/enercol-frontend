# Pautas de interfaz

Estas pautas describen los componentes de `src/shared/components/ui` y la composición del inicio de sesión y del espacio de trabajo. El objetivo de accesibilidad es WCAG 2.2 AA.

## Principios

- Una tarea principal por vista.
- El estado del control se entiende sin depender solo del color: hay texto, borde o `aria-*`.
- El foco visible no se elimina. Se sustituye por un anillo `--energy-text`.
- Los objetivos táctiles de la acción principal miden 48 px de alto.
- No se duplican estilos. La variación entra por `cva` y por los tokens, no por clases sueltas copiadas.

## Botón

Archivo: `src/shared/components/ui/button.tsx`.

| Variante | Uso |
| --- | --- |
| `primary` | La acción de la vista. En el login solo hay una |
| `secondary` | Acción alternativa sobre superficie blanca |
| `ghost` | Acción terciaria, sin fondo |
| `destructive` | Acción irreversible. No se usa en el login |

| Tamaño | Alto | Uso |
| --- | --- | --- |
| `default` | 48 px | Formularios y acciones principales |
| `sm` | 40 px | Zonas densas |
| `icon` | 48 px | Botón cuadrado con un solo icono |

Estados:

- **Hover:** el primario pasa a `--energy-hover`. No crece ni se desplaza.
- **Active:** `--energy-active`.
- **Focus:** anillo de 2 px, offset de 2 px.
- **Disabled:** fondo `--disabled`, texto `--disabled-foreground`, `disabled` nativo.
- **Loading:** no usa `disabled` nativo, para no perder el foco. Lleva `aria-busy`, el spinner y la etiqueta «Verificando». El clic se ignora.

`type` por defecto es `button`. El envío del formulario lo declara con `type="submit"`. `asChild` permite aplicar el estilo a un `Link` de React Router.

## Campo

Archivo: `src/shared/components/ui/input.tsx` y `src/shared/components/ui/label.tsx`.

- Alto 48 px, radio 8 px, texto de 16 px, fondo `--surface`.
- Borde `--border`. Hover `--border-strong`. Foco: borde y anillo `--energy-text`.
- Error: `aria-invalid`, borde `--destructive` y mensaje debajo.
- Deshabilitado: fondo `--sunken`, texto `--subtle`, cursor `not-allowed`.
- El placeholder es un ejemplo, no la etiqueta. La etiqueta es visible y está ligada con `htmlFor`.
- El autocompletado del navegador se fuerza al texto y al fondo de los tokens activos.

La etiqueta usa `@radix-ui/react-label`. Peso 600, 14 px, color de texto principal.

## Error de campo

Archivo: `src/shared/components/ui/field-error.tsx`.

El mensaje va en un `p` con `id`. El campo lo referencia con `aria-describedby` solo cuando el error existe. Color `--destructive`, 14 px. No se acompaña de un icono dentro del campo.

## Alerta

Archivo: `src/shared/components/ui/alert.tsx`.

| Tono | Rol | Cuándo |
| --- | --- | --- |
| `error` | `alert` | El envío no puede continuar |
| `info` | `status` | La validación local terminó y no hubo envío al servidor |

Título en el color del tono. Cuerpo en `--foreground`, para no pintar un párrafo entero de rojo o de azul. El icono es decorativo (`aria-hidden`).

## Badge

Archivo: `src/shared/components/ui/badge.tsx`.

| Tono | Dónde |
| --- | --- |
| `neutral` | Superficie clara |
| `signal` | Solo sobre Midnight Navy. Incluye un punto cian |
| `danger` | Estado de error compacto |

No se usa como sustituto de un título ni se agrupan varios badges para simular navegación.

## Tarjeta

Archivo: `src/shared/components/ui/card.tsx`.

Superficie `--surface`, borde `--line`, radio 12 px y `shadow-sm`. Partes: encabezado, título, descripción, contenido y pie. El login no mete el formulario en una tarjeta: la página ya es la superficie. La página provisional de inicio usa una tarjeta para marcar el contenido pendiente.

## Carga

Archivo: `src/shared/components/ui/spinner.tsx`.

Arco de 16 px. Gira solo si el usuario no pidió reducir el movimiento. No tiene texto propio: la etiqueta visible del botón es la que anuncia el estado.

## Formulario de acceso

Archivos: `src/modules/auth/`.

Campos:

1. Correo electrónico. `autoComplete="email"`, `inputMode="email"`.
2. Contraseña. `autoComplete="current-password"`. El botón interno muestra u oculta el valor, con `aria-pressed` y un nombre accesible.

Validación con Zod y React Hook Form, modo `onTouched`:

| Campo | Condición | Mensaje |
| --- | --- | --- |
| Correo | Vacío | Ingrese su correo electrónico. |
| Correo | Formato inválido | Ingrese un correo electrónico válido. |
| Contraseña | Vacía | Ingrese su contraseña. |
| Contraseña | Menos de 8 caracteres | La contraseña debe tener al menos 8 caracteres. |

Al fallar el envío, el primer campo inválido recibe el foco después del render y aparece una alerta de error. Al corregir un valor, la alerta de formulario se retira; el error del campo sigue hasta que ese campo sea válido.

Zod revisa el formulario antes de llamar al servicio. Si los datos son válidos, se envían a `POST /api/v1/auth/login`. El botón muestra «Verificando» mientras la solicitud está en curso y no admite otro envío. Un error del servicio se muestra en una alerta. Si Cognito exige otro paso, el mismo panel pide la contraseña nueva o el código, y la respuesta sale por `POST /api/v1/auth/challenge`.

La sesión vive en una cookie HttpOnly que controla el backend. El token CSRF llega en el cuerpo de la sesión y se envía en `X-CSRF-Token` al cerrar sesión. No se guarda en `localStorage` ni en `sessionStorage`.

El formulario lleva `noValidate` para que el navegador no duplique los mensajes.

Bajo el formulario, una nota de 14 px indica que el acceso está reservado a usuarios autorizados. No hay enlace de registro ni de recuperación.

## Composición del login

Concepto y voz: [BRAND-IDENTITY.md](./BRAND-IDENTITY.md).

| Ancho | Composición |
| --- | --- |
| Menos de 1024 px | Una columna. Cabecera navy compacta, filete cian inferior y formulario debajo |
| 1024 px o más | Columna de identidad fluida y columna de formulario entre 26 y 34 rem. El documento no se desplaza: cada columna lo hace si el contenido no cabe |

La página ocupa el alto del viewport. En escritorio el diagrama cede el espacio sobrante y se alinea al pie. Por debajo de 800 px de alto se reducen márgenes y tamaños. Por debajo de 640 px el diagrama sale de la composición. El texto de marca no se recorta: si aún no cabe, la columna se desplaza.

El selector de apariencia queda arriba a la derecha del bloque del formulario. El titular de la página, y único `h1`, es «Iniciar sesión». La frase de marca es un párrafo, aunque se componga más grande.

## Apariencia

El control es un grupo de radio con tres opciones: Claro, Oscuro y Sistema. Los iconos son Sol, Luna y Monitor. La opción elegida se guarda en `localStorage` con la clave `enercol-theme`. Sistema sigue `prefers-color-scheme`. Un script en `index.html` aplica la preferencia antes del primer pintado.

El mismo control está en el inicio de sesión y en la barra del espacio de trabajo.

## Espacio de trabajo

La ruta `/app` muestra la estructura, sin datos de operación. Incluye navegación, barra superior, área de contenido, selector de tema y un espacio que indica que la sesión no está iniciada. En pantallas menores de 1024 px la navegación se abre en un panel con cierre, tecla Escape y ciclo de tabulador. Inicio es el único destino. Solicitudes postventa, Análisis técnicos e Informes técnicos se muestran como texto con la marca «Próximamente».

## Teclado y lectura

- El primer control enfocable es «Saltar al formulario de acceso».
- Orden del formulario: correo, contraseña, mostrar u ocultar, enviar.
- Los iconos de ojo y de alerta no se anuncian.
- El panel lleva `aria-label="EnerCol"`. La sección del formulario se etiqueta con el `h1`.
- `lang="es"` está en el documento.

## Movimiento

Ver la tabla de [DESIGN-TOKENS.md](./DESIGN-TOKENS.md). No se anima la entrada de la página.

## Qué no hacer

- No añadir un segundo botón primario en la misma vista.
- No poner iconos dentro de los campos si no ejecutan una acción.
- No usar Electric Cyan como color de foco o de texto sobre fondo claro.
- No mostrar métricas inventadas en el panel de identidad ni en el espacio de trabajo.
- No abrir registro público, recuperación de clave ni proveedores sociales en esta fase.
- No conectar todavía Cognito, NestJS ni una sesión real.
