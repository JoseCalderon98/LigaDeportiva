import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Liga Deportiva — Gestión de Torneos",
  description:
    "Plataforma accesible para la gestión de torneos deportivos y tabla de posiciones en tiempo real.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 transition-colors">
        {/* Enlace para saltar directamente al contenido accesible por teclado */}
        <a
          href="#contenido-principal"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-md focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 font-medium"
        >
          Saltar al contenido
        </a>

        {/* Encabezado semántico accesible */}
        <header className="border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur sticky top-0 z-40">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white font-black text-lg"
                aria-hidden="true"
              >
                ⚽
              </span>
              <span className="font-bold text-lg sm:text-xl tracking-tight text-slate-900 dark:text-white">
                Liga Deportiva
              </span>
            </div>
            <nav aria-label="Navegación principal">
              <ul className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300">
                <li>
                  <Link
                    href="/"
                    className="hover:text-blue-600 dark:hover:text-blue-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded px-2 py-1 transition-colors"
                  >
                    Inicio
                  </Link>
                </li>
                <li>
                  <Link
                    href="/calendario"
                    className="hover:text-blue-600 dark:hover:text-blue-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded px-2 py-1 transition-colors"
                  >
                    Calendario
                  </Link>
                </li>
                <li>
                  <Link
                    href="/admin/partidos"
                    className="hover:text-blue-600 dark:hover:text-blue-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded px-2 py-1 transition-colors"
                  >
                    Admin
                  </Link>
                </li>
              </ul>
            </nav>
          </div>
        </header>

        {/* Región de contenido principal con un solo h1 por página */}
        <main
          id="contenido-principal"
          className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12"
        >
          {children}
        </main>

        {/* Pie de página semántico accesible */}
        <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-6 mt-auto">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            <p>
              © {new Date().getFullYear()} Liga Deportiva. Todos los derechos
              reservados. Accesibilidad WCAG 2.2 AA.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
