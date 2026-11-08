# Identidad de EnerCol

EnerCol es una plataforma de análisis técnico para el sector energético. La identidad debe verse como un instrumento de trabajo: precisa, sobria y estable. No compite con el dato.

Este manual fija las decisiones de marca de la fase 1. Los valores implementados viven en `src/styles/globals.css`. Si un valor cambia, se actualiza primero el token y después este documento.

## Personalidad

| Rasgo | Cómo se ve | Cómo se escribe |
| --- | --- | --- |
| Tecnológica | Geometría de diagrama unifilar, no ilustración decorativa | Sustantivos del sistema eléctrico |
| Confiable | Superficies planas, contraste alto, una sola acción primaria | Trato de usted, sin urgencia artificial |
| Analítica | Índices numerados, etiquetas cortas, jerarquía tipográfica clara | Hechos y dominios, no promesas |
| Precisa | Retícula de 4 px, radios contenidos, una línea de acento | Una idea por frase |
| Profesional | Mucho espacio, pocos elementos, sin gradientes en controles | Sin exclamaciones ni metáforas de marketing |

## Concepto: Energy Intelligence

La lectura de la energía es el concepto de la interfaz, no un eslogan de campaña. En el inicio de sesión se expresa con tres piezas:

1. Un campo Midnight Navy que funciona como superficie de instrumento.
2. Un diagrama unifilar —generación, barra, demanda— con un circuito en Electric Cyan.
3. Un formulario sobre la superficie de la página, con una sola tarea: entrar.

El panel de identidad permanece en Midnight Navy en los temas claro y oscuro. No se invierte. La página y los controles sí cambian de superficie.

El cian marca la señal viva. No decora titulares sobre fondo claro.

## Nombre

Se escribe **EnerCol**, con E y C mayúsculas, sin espacio y sin guion. En texto corrido no se pone entre comillas ni en mayúsculas sostenidas.

El nombre del producto no se traduce.

## Marca gráfica

La marca tiene dos piezas: el signo y el wordmark.

El signo es un cuadrado de 36 unidades con radio 7. Dentro hay una barra vertical y tres derivaciones horizontales. La derivación central es la señal: usa el color de acento del tono y termina en un nodo.

| Tono | Uso | Estructura | Señal |
| --- | --- | --- | --- |
| Inverse | Fondos Midnight Navy | Cloud White | Electric Cyan |
| Default | Fondos Cloud White, blanco o superficie oscura | Midnight Navy en claro; Cloud White en oscuro | `--energy-text` |

El wordmark es «EnerCol» en Nunito Sans, peso 600, tracking `-0.02em`. No se altera el espaciado entre «Ener» y «Col».

### Área de reserva

El área libre alrededor del lockup es, como mínimo, la altura del signo. No se colocan textos, bordes ni otros símbolos dentro de esa zona.

### Tamaños

| Aplicación | Signo | Lockup |
| --- | --- | --- |
| Mínimo digital | 24 px | 32 px de alto |
| Interfaz | 36 px | Alto del signo más el wordmark a 18 px |
| Favicon | 32 px, solo el signo sobre Midnight Navy | No usar el wordmark |

### Usos incorrectos

- Rotar, deformar o aplicar sombra al signo.
- Cambiar la señal a otro color que no sea cian sobre navy o `--energy-text` sobre claro u oscuro.
- Poner el wordmark en Electric Cyan sobre fondo claro.
- Encerrar la marca en un círculo, una pastilla o un recuadro adicional.
- Reconstruir el signo con otra tipografía o con un icono genérico de rayo.

## Voz

La interfaz habla en español, con trato de **usted**.

- Frases cortas y literales.
- El verbo indica la acción: «Inicie sesión», «Ingrese su contraseña».
- Los errores dicen qué corregir. No culpan al usuario.
- No se usan «¡Bienvenido!», «potencia tu energía» ni textos de relleno.
- No se prometen módulos que todavía no existen. El índice del login nombra dominios de análisis, no navegación.

## Lo que esta fase no es

EnerCol no tiene registro público, recuperación de contraseña ni acceso social. El inicio de sesión es un acceso cerrado para usuarios autorizados por su organización.
