import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-4 space-y-6">
      <div
        className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center text-3xl font-black"
        aria-hidden="true"
      >
        404
      </div>
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100">
          Página o recurso no encontrado
        </h1>
        <p className="text-slate-600 dark:text-slate-400 max-w-md mx-auto text-sm sm:text-base">
          El equipo, torneo o página que estás buscando no existe o ha sido trasladado.
        </p>
      </div>
      <Link
        href="/"
        className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
      >
        Volver a la tabla de posiciones
      </Link>
    </div>
  );
}
