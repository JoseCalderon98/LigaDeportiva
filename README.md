# ⚽ Liga Deportiva (45-liga-deportiva)

Plataforma web atómica construida en **Next.js (App Router)**, **React 19** y **TypeScript estricto** para la gestión integral de torneos deportivos: inscripción de equipos, generación automática de calendarios round-robin, cálculo dinámico de la tabla de posiciones con criterios de desempate oficiales, perfiles de equipos, gráficos de evolución de puntos y módulo de administración con autenticación basada en cookies HttpOnly.

Cumple estrictamente con los estándares de accesibilidad **WCAG 2.2 Nivel AA** (HTML semántico, foco visible, contraste superior a 4.5:1, `aria-sort`, regiones en vivo `aria-live` y tablas de datos alternativas para elementos visuales).

---

## 🛠️ Arquitectura y Tecnologías

- **Framework:** [Next.js](https://nextjs.org/) (App Router, Server Components por defecto, TypeScript en modo estricto).
- **Validación de Datos:** [Zod](https://zod.dev/) en modo estricto (`.strict()`) compartido entre cliente y servidor en `src/schemas/`.
- **Servicios Puros:** Reglas de negocio aisladas y deterministas en `src/services/` sin acoplamiento a React ni Firebase.
- **Backend y Persistencia:** Route Handlers (`export const runtime = "nodejs"`) y repositorio Firestore en `src/repositories/torneos.repo.ts` mediante `firebase-admin`.
- **Autenticación:** Firebase Authentication en el cliente (`firebase/auth`) y sesiones seguras en el servidor mediante cookies HttpOnly a 5 días con directivas `Secure; SameSite=Lax`.
- **Almacenamiento de Archivos:** [Vercel Blob](https://vercel.com/docs/storage/vercel-blob) para la subida de escudos oficiales.
- **Pruebas Automatizadas:** [Vitest](https://vitest.dev/) + [React Testing Library](https://testing-library.com/) en entorno `jsdom`.
- **Estilos:** Tailwind CSS con soporte para `prefers-reduced-motion` y modo oscuro/claro.

---

## 📋 Requisitos Previos

- **Node.js:** Versión 20.x o superior (recomendado Node 22+).
- **npm:** Gestor de paquetes incluido con Node.js.
- **Proyecto en Firebase:** Con Authentication (correo/contraseña) y Firestore habilitado.
- **Vercel Blob Store:** Para carga de imágenes (opcional en desarrollo local con datos demo).

---

## 🚀 Instalación y Puesta en Marcha

1. **Clonar o situarse en el repositorio:**
   ```bash
   cd 45-liga-deportiva
   ```

2. **Instalar dependencias:**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno:**
   Copia el archivo de ejemplo:
   ```bash
   cp .env.example .env.local
   ```
   Rellena los valores requeridos según se detalla a continuación.

---

## ⚙️ Configuración de Variables de Entorno y Servicios

### Archivo `.env.local`
```env
# Variables públicas consumidas por el cliente (navegador)
NEXT_PUBLIC_FIREBASE_API_KEY=tu_api_key_publica
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tu_proyecto.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=tu_proyecto_id
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef

# Variables privadas de servidor (NUNCA exponer en cliente ni en NEXT_PUBLIC_*)
FIREBASE_PROJECT_ID=tu_proyecto_id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@tu_proyecto_id.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgk...=\n-----END PRIVATE KEY-----\n"

# Token de Vercel Blob para almacenamiento de escudos
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxxxxxxx
```

### Reglas de Seguridad en Firestore
Siguiendo las mejores prácticas de seguridad, la base de datos Firestore **rechaza todas las lecturas y escrituras directas desde el navegador**:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```
> **Nota de Seguridad:** Todo el acceso a la base de datos se realiza a través de las rutas de la API en el servidor con `firebase-admin`, garantizando validación con Zod y control de roles.

---

## 💻 Comandos del Proyecto

| Comando | Descripción |
| :--- | :--- |
| `npm run dev` | Inicia el servidor de desarrollo en `http://localhost:3000` con Turbopack |
| `npm test` | Ejecuta la suite de pruebas unitarias y de integración con Vitest |
| `npm run lint` | Ejecuta el linter ESLint con reglas estrictas de Next.js y TypeScript |
| `npm run build` | Compila el proyecto optimizado para producción con Turbopack |
| `npm start` | Inicia el servidor de producción previamente compilado |

---

## 📡 Documentación de la API y Pruebas con Bruno

- **OpenAPI 3.0.3:** Especificación OpenAPI completa disponible en el archivo [`openapi.yaml`](./openapi.yaml) en la raíz del proyecto.
- **Colección Bruno:** En la carpeta [`bruno/`](./bruno/) se incluye la colección lista para usar con el entorno `local.bru`:
  - `01-iniciar-sesion.bru`: `POST /api/auth/sesion`
  - `02-obtener-perfil.bru`: `GET /api/auth/yo`
  - `03-posiciones-exito-200.bru`: `GET /api/torneos/{{torneoId}}/posiciones`
  - `04-resultado-exito-200.bru`: `PUT /api/torneos/{{torneoId}}/partidos/{{partidoId}}/resultado` (200 éxito)
  - `05-resultado-validacion-400.bru`: Validación con goles negativos (400)
  - `06-resultado-sin-sesion-401.bru`: Petición no autenticada (401)
  - `07-resultado-no-organizador-403.bru`: Petición por usuario no organizador (403)
  - `08-resultado-inexistente-404.bru`: Partido inexistente (404)

---

## 🌐 Despliegue en Vercel

1. Importa el repositorio en el panel de [Vercel](https://vercel.com).
2. Configura las variables de entorno (`NEXT_PUBLIC_FIREBASE_*`, `FIREBASE_*`, `BLOB_READ_WRITE_TOKEN`).
3. Agrega la integración de **Vercel Blob** en la sección *Storage* del proyecto.
4. Despliega la rama principal. Las cabeceras de seguridad HTTP (`X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options` y `Content-Security-Policy`) se aplicarán automáticamente gracias a [`next.config.ts`](./next.config.ts).
