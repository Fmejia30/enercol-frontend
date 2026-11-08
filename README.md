# EnerCol

**Energy Intelligence & Technical Analysis**

EnerCol es una prueba de concepto para el análisis técnico de solicitudes postventa de clientes industriales del sector energético. Este repositorio es el frontend de la historia de usuario HU-01: inicio de sesión con control de acceso por rol.

## Descripción general

El producto está pensado como el espacio de trabajo donde un especialista consulta solicitudes, lee información técnica y prepara informes. Esta entrega no implementa esas operaciones. Construye el acceso, la sesión y la experiencia que depende del rol.

El frontend se autentica contra un backend NestJS que actúa como intermediario (BFF) frente a Cognito. El navegador no habla con Cognito ni conserva tokens de acceso. La sesión vive en una cookie que establece el backend. Los roles y permisos que muestra la interfaz salen de la identidad que devuelve ese backend. La autorización de las operaciones sigue siendo responsabilidad de NestJS.

## Funcionalidades implementadas

- Inicio de sesión con correo y contraseña. La validación local usa Zod y React Hook Form. Un envío vacío o con un correo inválido no sale del navegador.
- Autenticación mediante Cognito a través del BFF: `POST /auth/login`.
- Sesión por cookie, con `withCredentials`. El token CSRF llega en el cuerpo de la respuesta, permanece en memoria y se envía en el encabezado `X-CSRF-Token`.
- Recuperación de sesión al cargar la aplicación: `GET /auth/session` y, si hay sesión, `GET /identity/me`. Mientras esa consulta sigue en curso se muestra «Verificando sesión» y no el formulario.
- Cierre de sesión con `POST /auth/logout`. Si la llamada falla, la interfaz conserva el estado autenticado.
- Preparación de los retos que el backend puede pedir: `NEW_PASSWORD_REQUIRED`, `SMS_MFA`, `SOFTWARE_TOKEN_MFA`, `EMAIL_OTP` y `MFA_SETUP`, mediante `POST /auth/challenge`.
- Modelo de roles `SPECIALIST`, `VALIDATOR` y `ADMINISTRATOR`, con una matriz centralizada de permisos. Varios roles se acumulan. Un rol desconocido no concede permisos ni invalida el resto de una identidad válida.
- Protección de rutas: `/login` para quien no tiene sesión y `/app` para quien sí la tiene. El regreso después del acceso solo acepta una ruta interna.
- `PermissionGuard` y la página 403, listos para una ruta futura que exija permisos. `/app` solo exige autenticación.
- Componente `Can` y navegación filtrada por los permisos de cada opción.
- Dashboard de bienvenida con saludo según la hora, perfil de acceso, áreas previstas del producto y la indicación de sesión activa. No hay métricas ni registros.
- Temas claro, oscuro y sistema. La preferencia se guarda en `localStorage` con la clave `enercol-theme` y se aplica antes del primer pintado.
- Página 404 para una ruta no definida.

La identidad que consume el frontend tiene `userId` y `roles`. El usuario de sesión tiene `id`, `email` (puede ser nulo) y `roles`. No llega un nombre, así que el saludo del dashboard no lo inventa. El correo se muestra en el sidebar. El código interno del rol no se muestra ahí; en el perfil de acceso se usan las etiquetas «Especialista técnico», «Especialista validador» y «Administrador».

## Arquitectura

Los providers envuelven la aplicación en este orden: tema, autenticación y autorización. La autorización se deriva de la identidad autenticada. No hay un almacén propio de roles ni se usa Zustand.

```text
ThemeProvider
  AuthProvider
    AuthorizationProvider
      RouterProvider
```

| Zona | Responsabilidad |
| --- | --- |
| `src/app/` | Composición, rutas, guards y páginas 403 y 404 |
| `src/modules/auth/` | Contrato, cliente de sesión, login y retos |
| `src/modules/access/` | Roles, permisos, `useAuthorization()` y `Can` |
| `src/modules/home/` | Dashboard de `/app` |
| `src/modules/shell/` | Sidebar, navegación móvil y cabecera |
| `src/shared/` | Cliente HTTP, tema y componentes visuales |
| `src/config/` | Nombre de la aplicación, tema y navegación |
| `docs/brand/` | Manual de marca |

El alias `@` apunta a `src`. Tailwind CSS 4 entra por el plugin de Vite y por `src/styles/globals.css`. No hay un `tailwind.config`. Los componentes de interfaz viven en `src/shared/components/ui` y usan Radix UI para la etiqueta y el slot.

## Tecnologías

Las versiones declaradas están en `package.json`. El lockfile del repositorio es `package-lock.json`.

| Pieza | Uso |
| --- | --- |
| React 19 y React DOM | Interfaz |
| TypeScript 7 | Tipos. El build ejecuta `tsc -b` |
| Vite 8 | Desarrollo y build |
| Tailwind CSS 4 | Estilos, mediante `@tailwindcss/vite` |
| Radix UI | `@radix-ui/react-label` y `@radix-ui/react-slot` |
| React Router 7 | Rutas |
| React Hook Form y Zod 4 | Formulario de acceso |
| Axios | Cliente HTTP |
| Lucide | Iconos |
| Nunito Sans | Tipografía autoalojada con `@fontsource-variable/nunito-sans` |
| Oxlint | Análisis estático |

## Requisitos

Vite 8, la herramienta de build de este proyecto, exige Node.js `^20.19.0` o `>=22.12.0`. La instalación usa npm.

El frontend necesita el backend NestJS en ejecución y un `VITE_API_BASE_URL` que incluya el prefijo `/api/v1`.

## Instalación

```bash
npm install
cp .env.example .env
```

`.env` está ignorado por Git. `.env.example` sí se versiona.

## Configuración

| Variable | Uso |
| --- | --- |
| `VITE_API_BASE_URL` | Base del API, con el prefijo `/api/v1`. El ejemplo local es `http://localhost:3000/api/v1`. Si falta o está vacía, el cliente no envía la petición. |
| `VITE_APP_NAME` | Nombre que se usa en el título del documento. Si falta o queda en blanco, la interfaz usa EnerCol. |

El cliente Axios usa un tiempo de espera de 15 segundos, `Accept: application/json` y cookies. No guarda tokens en `localStorage` ni en `sessionStorage`. La única clave de `localStorage` es `enercol-theme`.

Las rutas relativas del cliente son:

| Método | Ruta | Uso |
| --- | --- | --- |
| `POST` | `/auth/login` | Correo y contraseña |
| `POST` | `/auth/challenge` | Respuesta a un reto |
| `GET` | `/auth/session` | Sesión actual |
| `POST` | `/auth/logout` | Cierre de sesión |
| `GET` | `/identity/me` | `userId` y roles |

## Ejecución

```bash
npm run dev
```

Vite imprime la URL local. Si el puerto 5173 está libre, la aplicación queda en [http://localhost:5173](http://localhost:5173). `/` redirige a `/login`. El espacio de trabajo está en `/app`.

Otros comandos:

```bash
npm run build      # tsc -b y build de producción
npm run preview    # sirve el resultado de dist
npm run lint       # oxlint
npm test           # pruebas unitarias con node:test
```

## Pruebas

`npm test` ejecuta el runner de Node con `--experimental-strip-types` sobre:

- `src/modules/access/*.test.ts`
- `src/app/*.test.ts`
- `src/modules/home/*.test.ts`

Cubren permisos, guards, la navegación filtrada y el contenido del dashboard. Los archivos `*.test.ts` quedan fuera de `tsconfig.app.json`, así que `npm run build` no los compila con la aplicación.

## Rutas

| Ruta | Acceso | Pantalla |
| --- | --- | --- |
| `/` | Público | Redirige a `/login` |
| `/login` | Sin sesión | Inicio de sesión. Con sesión, regresa a una ruta interna segura o a `/app` |
| `/app` | Sesión autenticada | Dashboard. No exige un permiso adicional |
| Cualquier otra | Según el layout | Página 404, con regreso al inicio de sesión |

Durante la carga no se muestra el contenido protegido. Un usuario autenticado sin roles entra a `/app` y no ve las secciones que exigen permiso.

## Roles y permisos

`ADMINISTRATOR` solo recibe su matriz si la identidad trae exactamente ese valor. Los permisos de varios roles se suman.

| Permiso | Especialista | Validador | Administrador |
| --- | --- | --- | --- |
| `workspace:access` | Sí | Sí | Sí |
| `requests:read_assigned` | Sí | Sí | Sí |
| `requests:read_all` | | | Sí |
| `telemetry:read` | Sí | Sí | Sí |
| `analysis:execute` | Sí | | Sí |
| `analysis:read` | Sí | Sí | Sí |
| `reports:create` | Sí | | Sí |
| `reports:read` | Sí | Sí | Sí |
| `reports:validate` | | Sí | Sí |
| `reports:reject` | | Sí | Sí |
| `reports:return` | | Sí | Sí |
| `audit:read` | | | Sí |
| `users:manage` | | | Sí |
| `configuration:manage` | | | Sí |

La navegación actual usa tres de esos permisos y no abre rutas de negocio:

| Sección | Permiso | Presentación |
| --- | --- | --- |
| Inicio | Ninguno | Enlace a `/app` |
| Solicitudes postventa | `requests:read_assigned` | Texto «Próximamente» |
| Análisis técnicos | `analysis:read` | Texto «Próximamente» |
| Informes técnicos | `reports:read` | Texto «Próximamente» |

`canActOnReport()` niega validar, rechazar o devolver un informe cuando el actor es su autor. Esa regla está centralizada y todavía no tiene una pantalla de informes.

## Estructura

```text
docs/brand/                         Manual de marca
src/app/                            Aplicación, rutas, guards, 403 y 404
src/config/                         Entorno, tema y navegación
src/modules/access/                 Roles, permisos, autorización y Can
src/modules/auth/                   Login, retos y sesión
src/modules/home/                   Dashboard
src/modules/shell/                  Marco, sidebar y navegación móvil
src/shared/components/brand/        Signo, lockup y diagrama
src/shared/components/theme/        Selector de apariencia
src/shared/components/ui/           Botón, campo, etiqueta, error, alerta, badge, tarjeta y carga
src/shared/lib/                     Cliente HTTP, errores y CSRF en memoria
src/shared/theme/                   ThemeProvider
src/styles/globals.css              Tokens y Tailwind
```

## Manual de marca

- [Identidad](docs/brand/BRAND-IDENTITY.md)
- [Color](docs/brand/COLOR-SYSTEM.md)
- [Tipografía](docs/brand/TYPOGRAPHY.md)
- [Tokens](docs/brand/DESIGN-TOKENS.md)
- [Interfaz](docs/brand/UI-GUIDELINES.md)

La paleta principal es Midnight Navy `#1C1D2C`, Energy Blue `#005490`, Electric Cyan `#00B0F0` y Cloud White `#F5F7FA`. Los tokens aplicados están en `src/styles/globals.css`.

## Fuera de alcance

- Gestión de solicitudes, telemetría, análisis, informes, validación, usuarios y configuración.
- Métricas, indicadores y registros operativos.
- Registro público y recuperación de contraseña.
- El frontend no sustituye la autorización del backend.
