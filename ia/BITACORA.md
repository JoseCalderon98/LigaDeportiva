# Bitácora de Uso de IA — 45-liga-deportiva

## 1. Configuración Inicial y Pruebas de Seguridad (Commit 1)
- **Propósito:** Configurar `AGENTS.md`, `.aiignore` y restricciones de permisos en Antigravity antes de generar código de la aplicación.
- **Evidencia:** Capturas en `ia/` (`file-permissions.png`, `prueba-1-env.png`, `prueba-2-ruta.png`, `prueba-3-firestore.png`).
- **Validación:** Se probó que el agente rechaza leer `.env.local`, rechaza listar `../` y rechaza importar `firebase/firestore` en el navegador.
- **Decisión:** Configuración aprobada para iniciar el Hito 1.

## 2. Hito 1 — Capa de Esquemas y Lógica Pura
- **Propósito:** Implementar la capa de validación estricta (`src/schemas/liga.ts`) y la lógica de cálculo de posiciones y desempates en función pura (`src/services/posiciones.ts`).
- **Componentes Creados:**
  - `src/schemas/liga.ts`: `EquipoSchema`, `PartidoSchema`, `ResultadoInputSchema`, `PosicionTablaSchema`, `GoleadorSchema` y `TorneoSchema` (todos en `.strict()`) con refinamientos para evitar auto-enfrentamientos y requerir goles enteros no nulos cuando un partido es jugado.
  - `src/services/posiciones.ts`: Función pura `calcularTablaPosiciones(equipos, partidos)` con recálculo desde cero, asignación de puntos (3 victoria, 1 empate, 0 derrota) y 4 criterios de desempate en cascada (`pts`, `dg`, `gf`, `nombre` alfabético).
  - `vitest.config.mts`: Configuración de pruebas para resolución de alias `@/` y entorno `jsdom`.
  - `tests/schemas.test.ts` y `tests/posiciones.test.ts`: 27 pruebas unitarias completas.
- **Validación:**
  - `npx vitest run`: 27/27 pruebas superadas.
  - `npm run lint`: 0 errores de ESLint.
  - `npx tsc --noEmit`: 0 errores de TypeScript estricto.

## 3. Hito 1 — Interfaz Accesible y Endpoint Demo (Commit 2)
- **Propósito:** Completar el endpoint de demostración y la interfaz de usuario accesible (WCAG 2.2 AA) con recálculo interactivo en vivo.
- **Componentes Creados y Actualizados:**
  - `src/schemas/liga.ts`: Incorporación de `GoleadorSchema` y `TorneoSchema` en modo `.strict()`.
  - `src/lib/datos-demo.ts`: Datos iniciales validados con Zod (Torneo Interno 2026, 6 equipos, 10 partidos jugados con empates en puntos, 2 partidos pendientes y tabla de goleadores).
  - `src/app/api/torneos/demo/posiciones/route.ts`: Route Handler REST (`export const runtime = "nodejs"`) que calcula y sirve la tabla de posiciones en el servidor con manejo de errores `{ error: string }`.
  - `src/components/TablaPosiciones.tsx`: Componente accesible con HTML semántico (`<table>`, `<caption>`, `<thead>`, `<tbody>`, `<th scope="col">`, `<th scope="row">`), ordenamiento por columnas con actualización de `aria-sort`, y formulario controlado para registrar resultados validando con `ResultadoInputSchema`, anuncios en `aria-live="polite"` y errores con `aria-describedby`.
  - `src/app/layout.tsx`: Configuración `lang="es"`, enlace de salto accesible ("Saltar al contenido"), `<header>`, `<nav>`, `<main id="contenido-principal">` y `<footer>`.
  - `src/app/page.tsx`: Consumo con `fetch` manejando explícitamente estados de carga (esqueleto accesible `aria-busy`), vacío, error con botón `<button>` de reintento, y éxito con diseño mobile-first sin desbordamiento horizontal en 360px, 768px y 1024px.
  - `src/app/globals.css`: Soporte para `prefers-reduced-motion` y `prefers-color-scheme`.
  - `tests/TablaPosiciones.test.tsx`: 4 pruebas de integración de componentes con React Testing Library consultando por roles y etiquetas accesibles (`getByRole`, `getByLabelText`, `getByText`).
  - `tests/apiDemo.test.ts`: Prueba de integración del Route Handler.
- **Validación:**
  - `npx vitest run`: **32/32 pruebas superadas** (100% de éxito en 4 suites de pruebas).
  - `npm run lint`: **0 errores y 0 advertencias de ESLint**.
  - `npm run build`: Compilación de producción exitosa en Turbopack con generación de rutas estáticas y dynamic route handler.


## 4. Hito 2 — Calendario Round-Robin, Perfiles de Equipos y Gráficos Accesibles (Commit 3)
- **Propósito:** Implementar la generación automática de calendarios todos contra todos (round-robin), vistas de calendario imprimibles, páginas de detalle de equipo y gráficos SVG con tabla alternativa (WCAG 2.2 AA).
- **Componentes Creados y Actualizados:**
  - `src/services/calendario.ts`: Función pura `generarCalendarioTodosContraTodos(equipos, fechaInicio)` mediante algoritmo Berger (round-robin), garantizando exactamente $N(N-1)/2$ partidos, balance de localía, sin duplicados ni auto-enfrentamientos, y fechas ISO 8601 válidas.
  - `src/lib/fechas.ts`: Función `formatearFecha` con localización `es-CO` y respaldo seguro a formato ISO.
  - `src/components/BotonImprimir.tsx`: Botón cliente accesible para invocar `window.print()` excluido de la impresión.
  - `src/app/calendario/page.tsx`: Server Component con partidos agrupados por jornada, marcadores y tabla de goleadores, con metadata única.
  - `src/app/globals.css`: Reglas `@media print` para ocultar navegación, encabezado, pie y botones en la impresión.
  - `src/app/equipos/[id]/page.tsx`: Ruta dinámica con perfil completo, escudo optimizado, posición y estadísticas del torneo, e historial de resultados y partidos próximos con llamada a `notFound()`.
  - `src/app/not-found.tsx`: Página 404 semántica y accesible con enlace de retorno.
  - `src/components/GraficoPuntos.tsx`: Gráfico SVG accesible (`role="img"`, `aria-label`, contraste $\ge 3:1$) con líneas de evolución de puntos por jornada y botón interactivo para mostrar la tabla de datos alternativa.
  - `src/app/page.tsx`: Integración del componente `GraficoPuntos`.
  - `src/app/admin/partidos/page.tsx`: Página accesible para la sección de administración de partidos.
  - `src/app/layout.tsx`: Navegación actualizada con enlaces reales `<Link>` hacia Inicio (`/`), Calendario (`/calendario`) y Admin (`/admin/partidos`).
  - `tests/calendario.test.ts`: 7 pruebas unitarias para el servicio de calendario.
  - `tests/GraficoPuntos.test.tsx`: 2 pruebas de componentes para el gráfico SVG y la tabla alternativa.
- **Validación:**
  - `npx vitest run`: **41/41 pruebas superadas** (100% de éxito en 6 suites de pruebas).
  - `npm run lint`: **0 errores y 0 advertencias de ESLint**.
  - `npm run build`: Compilación de producción exitosa con todas las rutas estáticas y dinámicas.


## 5. Hito 3 — Persistencia en Firestore, Auth con Cookie HttpOnly, Vercel Blob y Pruebas de Integración (Commit 4)
- **Propósito:** Implementar la capa completa de backend y persistencia en Firestore vía Admin SDK, autenticación segura con cookies HttpOnly, subida de archivos mediante Vercel Blob, envoltorio centralizado de errores y pruebas automatizadas de integración.
- **Componentes Creados:**
  - `src/lib/firebase-admin.ts`: Inicialización perezosa (lazy singleton) de `firebase-admin` en entorno de servidor con normalización de claves privadas (`\\n` a `\n`). Exporta `getAdminAuth()` y `getAdminDb()`.
  - `src/lib/firebase-client.ts`: Inicialización exclusiva en el navegador de Firebase Authentication (`firebase/auth`) usando variables públicas `NEXT_PUBLIC_FIREBASE_*`. Cumple la prohibición estricta de importar `firebase/firestore` en el cliente.
  - `src/lib/errores.ts`: Clase `AppError` y envoltorio de alto orden `manejar(handler)` que traduce errores de Zod a HTTP 400 (`{ error: "Datos inválidos", detalles: [{ campo, mensaje }] }`), maneja códigos HTTP de negocio (401, 403, 404, 409, 429), encapsula fallos imprevistos en HTTP 500 genérico y traza cabecera `x-request-id` sin exponer secretos.
  - `src/lib/auth-server.ts`: Funciones `requerirUsuario(request)` (valida cookie `sesion` o Bearer token) y `verificarOrigen(request)` (defensa contra ataques CSRF en métodos mutadores).
  - `src/app/api/auth/sesion/route.ts`: Endpoint `POST` para generar cookie de sesión HttpOnly a 5 días (`HttpOnly; Secure; SameSite=Lax; Path=/`) y `DELETE` para revocación.
  - `src/app/api/auth/yo/route.ts`: Endpoint `GET` para consulta de sesión activa.
  - `proxy.ts`: Proxy UX en la raíz para redirigir peticiones sin sesión desde `/admin/*` hacia `/login`.
  - `src/repositories/torneos.repo.ts`: Repositorio centralizado y único punto de contacto con Firestore bajo el modelo `torneos/{id}`, `torneos/{id}/equipos/{eid}`, `torneos/{id}/partidos/{pid}`, `torneos/{id}/goleadores/{jid}`.
  - `src/app/api/torneos/route.ts`: `GET` paginado por cursor y `POST` con vinculación a `organizadorUid`.
  - `src/app/api/torneos/[id]/equipos/route.ts` y `src/app/api/torneos/[id]/calendario/route.ts`: Endpoints con autorización estricta del organizador (`403` si no es el propietario).
  - `src/app/api/torneos/[id]/posiciones/route.ts`: Endpoint REST que computa la tabla en vivo desde Firestore.
  - `src/app/api/torneos/[id]/partidos/[pid]/resultado/route.ts`: Endpoint `PUT` con validación Zod, verificación de organizador (`403`), comprobación de existencia (`404`), actualización en Firestore e invalidación de caché con `revalidateTag`.
  - `src/app/api/liga-deportiva/upload/route.ts`: Subida segura con `handleUpload` de `@vercel/blob/client`, prefijo por usuario `usuarios/<uid>/`, restricción a imágenes (png, jpeg, webp) y límite de 2MB.
  - `src/app/login/page.tsx`: Pantalla de inicio de sesión accesible con Suspense boundary y conexión al backend.
  - `src/app/admin/partidos/page.tsx`: Panel completo del organizador para crear torneos, inscribir equipos, generar fixture y registrar marcadores oficiales.
  - `tests/api-resultados.test.ts`: Pruebas de integración simulando Firebase con `vi.mock` (casos 401 sin sesión, 400 datos inválidos, 403 usuario no organizador, 404 recurso inexistente y 200 integración completa con recálculo dinámico).
- **Validación:**
  - `npx vitest run`: **46/46 pruebas superadas** (100% de éxito en 7 suites).
  - `npm run lint`: **0 errores y 0 advertencias**.
  - `npm run build`: Compilación de producción con Turbopack exitosa para las 15 rutas (estáticas y dinámicas).


## 6. Hito 4 — Seguridad HTTP, Especificación OpenAPI y Colección Bruno (Commit 5)
- **Propósito:** Configurar cabeceras de seguridad HTTP en `next.config.ts`, generar la especificación completa OpenAPI 3.0.3, crear la colección de pruebas en Bruno y actualizar la documentación general del proyecto.
- **Componentes Creados y Actualizados:**
  - `next.config.ts`: Cabeceras de seguridad HTTP (`X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Frame-Options: DENY`, `Content-Security-Policy` restrictivo compatible con Next.js, Firebase Auth y Vercel Blob) y `images.remotePatterns` para `*.public.blob.vercel-storage.com` y `images.unsplash.com`.
  - `openapi.yaml`: Especificación OpenAPI 3.0.3 completa que documenta todas las rutas reales del backend (`/api/auth/*`, `/api/torneos/*`, `/api/liga-deportiva/upload`, `/api/torneos/demo/posiciones`), esquemas de seguridad (`cookieAuth`, `bearerAuth`), códigos HTTP (200, 201, 204, 400, 401, 403, 404, 409, 500) y esquemas de datos estructurados.
  - `bruno/`: Colección completa con `bruno.json`, entorno `local.bru` y 8 solicitudes automatizadas (`01-iniciar-sesion.bru`, `02-obtener-perfil.bru`, `03-posiciones-exito-200.bru`, `04-resultado-exito-200.bru`, `05-resultado-validacion-400.bru`, `06-resultado-sin-sesion-401.bru`, `07-resultado-no-organizador-403.bru`, `08-resultado-inexistente-404.bru`).
  - `README.md`: Documentación exhaustiva con descripción de arquitectura, requisitos, guía de instalación, configuración de variables de entorno y reglas cerradas de Firestore (`allow read, write: if false;`), comandos de desarrollo y pruebas, y guía de despliegue en Vercel.
  - `package.json`: Script `"test": "vitest run"` para soporte directo de `npm test`.
- **Validación Final:**
  - `npm test` (`npx vitest run`): **46/46 pruebas superadas** en 7 suites (100% de éxito).
  - `npm run lint`: **0 errores y 0 advertencias**.
  - `npm run build`: Compilación de producción con Turbopack exitosa para las 15 rutas (estáticas y dinámicas).


## 7. Depuración de Autenticación y Diagnóstico de Errores de Servidor
- **Propósito:** Mejorar la experiencia de usuario y diagnóstico de errores en `src/app/login/page.tsx` al establecer la sesión con Firebase Admin SDK.
- **Componentes Actualizados:**
  - `src/app/login/page.tsx`: Modificado para deserializar y presentar los mensajes y detalles de error provenientes del Route Handler `/api/auth/sesion`, facilitando la detección de credenciales de servidor faltantes (`FIREBASE_CLIENT_EMAIL` y `FIREBASE_PRIVATE_KEY`) o inconsistencias de proyecto.
- **Validación:**
  - `npx vitest run`: **46/46 pruebas superadas**.
  - `npm run lint`: **0 errores y 0 advertencias**.
  - `git push`: Sincronizado en la rama `main` del repositorio remoto.
