# Reglas del Proyecto: 45-liga-deportiva

## 1. Rol y Alcance
Proyecto atómico en Next.js (App Router) + TypeScript para gestionar una liga deportiva con tabla de posiciones automática. Cumple estrictamente los requisitos antes de agregar funciones extra.

## 2. Stack y Comandos
- Framework: Next.js (App Router, `src/`), React, TypeScript estricto.
- Validación: Zod en `src/schemas/`.
- Backend: Route Handlers (`app/api/**/route.ts`) con `firebase-admin` y `@vercel/blob`.
- Pruebas: Vitest + React Testing Library (`npx vitest run`).
- Lint: `npm run lint`.

## 3. Arquitectura Obligatoria
- `app/`: Páginas (Server Components por defecto; `"use client"` solo si hay estado, efectos o eventos) y `app/api/` (Route Handlers).
- `proxy.ts`: Redirección UX si falta cookie (en Next.js 16 reemplaza a `middleware.ts`).
- `src/schemas/`: Esquemas Zod estrictos (`.strict()`).
- `src/services/`: Reglas de negocio puras y testeables (ej. cálculo de posiciones y desempates).
- `src/repositories/`: Único lugar autorizado para importar `firebase-admin` (Firestore).
- `src/components/`: UI accesible (WCAG 2.2 AA).
- `src/lib/`: Auth, manejo de errores HTTP, cliente/admin Firebase.

## 4. Restricciones de Seguridad (INQUEBRANTABLES)
1. NUNCA leas, muestres, modifiques ni pidas el contenido de archivos `.env`, `.env.local` o credenciales privadas.
2. NUNCA salgas del directorio raíz de este proyecto (`45-liga-deportiva`).
3. NUNCA importes `firebase/firestore` en componentes o código del cliente (navegador). El navegador solo usa `firebase/auth`.
4. NUNCA pongas secretos en variables `NEXT_PUBLIC_*`.
5. Pide confirmación explícita antes de ejecutar comandos que afecten servicios externos o fuera del proyecto.

## 5. Calidad y Accesibilidad (WCAG 2.2 AA)
- HTML semántico (`<header>`, `<nav>`, `<main>`, `<footer>`, un solo `<h1>` por página).
- Cero `<div onClick>`; usa `<button>` o `<a>`.
- Tablas con `<caption>` y `scope="col"`/`scope="row"`.
- Diseño mobile-first probado en 360px, 768px y 1024px sin scroll horizontal.
- Ejecuta `npm run lint` y `npx vitest run` tras modificar código.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
