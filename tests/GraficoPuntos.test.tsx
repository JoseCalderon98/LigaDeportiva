import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { GraficoPuntos } from "@/components/GraficoPuntos";
import type { Equipo, Partido } from "@/schemas/liga";

describe("Componente GraficoPuntos (Accesibilidad y Semántica WCAG 2.2 AA)", () => {
  const equiposMock: Equipo[] = [
    { id: "eq-1", nombre: "Águilas Doradas", escudoUrl: null },
    { id: "eq-2", nombre: "Halcones Azules", escudoUrl: null },
  ];

  const partidosMock: Partido[] = [
    {
      id: "p-1",
      localId: "eq-1",
      visitanteId: "eq-2",
      fecha: "2026-11-01T15:00:00Z",
      golesLocal: 2,
      golesVisitante: 1,
      jugado: true,
      jornada: 1,
    },
    {
      id: "p-2",
      localId: "eq-2",
      visitanteId: "eq-1",
      fecha: "2026-11-08T15:00:00Z",
      golesLocal: 0,
      golesVisitante: 2,
      jugado: true,
      jornada: 2,
    },
  ];

  it("1. Renderiza el gráfico SVG accesible con role='img' y descripción", () => {
    render(<GraficoPuntos equipos={equiposMock} partidos={partidosMock} />);

    const svgGrafico = screen.getByRole("img", {
      name: /gráfico de líneas que representa la evolución de puntos/i,
    });
    expect(svgGrafico).toBeInTheDocument();

    // Título de la sección
    expect(
      screen.getByRole("heading", { name: /evolución de puntos por jornada/i })
    ).toBeInTheDocument();

    // Leyenda de equipos
    expect(screen.getByText("Águilas Doradas")).toBeInTheDocument();
    expect(screen.getByText("Halcones Azules")).toBeInTheDocument();
  });

  it("2. Botón accesible para alternar y mostrar la tabla de datos alternativa", () => {
    render(<GraficoPuntos equipos={equiposMock} partidos={partidosMock} />);

    const botonTabla = screen.getByRole("button", {
      name: /ver tabla accesible/i,
    });
    expect(botonTabla).toBeInTheDocument();
    expect(botonTabla).toHaveAttribute("aria-expanded", "false");

    // Al hacer clic se despliega la tabla alternativa
    fireEvent.click(botonTabla);
    expect(botonTabla).toHaveAttribute("aria-expanded", "true");
    expect(botonTabla).toHaveTextContent(/ocultar tabla/i);

    const tablaDatos = screen.getByRole("table");
    expect(tablaDatos).toBeInTheDocument();
    expect(
      screen.getByText(/datos tabulares de la evolución de puntos/i)
    ).toBeInTheDocument();

    // Los nombres de equipos actúan como encabezados de fila
    expect(
      screen.getByRole("rowheader", { name: /águilas doradas/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("rowheader", { name: /halcones azules/i })
    ).toBeInTheDocument();
  });
});
