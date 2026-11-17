"use client";

import { useState, type FormEvent, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { getClientAuth } from "@/lib/firebase-client";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const destinoRedireccion = searchParams.get("redirect") || "/admin/partidos";

  const [correo, setCorreo] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [cargando, setCargando] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [anuncioLive, setAnuncioLive] = useState<string>("");

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setCargando(true);
    setAnuncioLive("Iniciando sesión...");

    try {
      const auth = getClientAuth();
      const userCredential = await signInWithEmailAndPassword(
        auth,
        correo.trim(),
        password
      );

      // Obtenemos el idToken para la creación de la cookie HttpOnly
      const idToken = await userCredential.user.getIdToken();

      const res = await fetch("/api/auth/sesion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        const mensajeDetalle =
          errorData?.detalles ||
          errorData?.error ||
          "No fue posible establecer la sesión en el servidor.";
        throw new Error(
          typeof mensajeDetalle === "string"
            ? mensajeDetalle
            : "No fue posible establecer la sesión en el servidor."
        );
      }

      setAnuncioLive("Sesión iniciada exitosamente. Redirigiendo...");
      router.push(destinoRedireccion);
      router.refresh();
    } catch (err: unknown) {
      const mensaje =
        err instanceof Error
          ? err.message
          : "Credenciales inválidas o error de conexión.";
      setError(mensaje);
      setAnuncioLive(`Error: ${mensaje}`);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto py-8 sm:py-14 space-y-6">
      {/* Región live para accesibilidad */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {anuncioLive}
      </div>

      <div className="text-center space-y-2">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
          Iniciar Sesión
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Accede al panel de administración para gestionar torneos y marcadores.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        noValidate
        className="p-6 sm:p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-5"
      >
        {error && (
          <div
            role="alert"
            className="p-3.5 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 text-sm font-medium"
          >
            {error}
          </div>
        )}

        <div>
          <label
            htmlFor="input-correo"
            className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1"
          >
            Correo electrónico
          </label>
          <input
            id="input-correo"
            type="email"
            name="email"
            autoComplete="email"
            required
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
            placeholder="organizador@liga.com"
          />
        </div>

        <div>
          <label
            htmlFor="input-password"
            className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1"
          >
            Contraseña
          </label>
          <input
            id="input-password"
            type="password"
            name="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
            placeholder="••••••••"
          />
        </div>

        <button
          type="submit"
          disabled={cargando}
          className="w-full flex items-center justify-center px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 cursor-pointer disabled:cursor-not-allowed"
        >
          {cargando ? "Iniciando sesión..." : "Ingresar"}
        </button>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="py-20 text-center" role="status">
          <p className="text-slate-500">Cargando formulario de acceso...</p>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
