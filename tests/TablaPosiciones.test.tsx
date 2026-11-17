import { describe, it, expect } from "vitest";
import { render, screen, within, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TablaPosiciones } from "@/components/TablaPosiciones";
import type { Equipo, Partido } from "@/schemas/liga";

describe("Componente TablaPosiciones (Accesibilidad y Semántica WCAG 2.2 AA)", () => {
  const equiposMock: Equipo[] = [
    {
      id: "eq-1",
      nombre: "Águilas Doradas",
      escudoUrl: null,
    },
    {
      id: "eq-2",
      nombre: "Halcones Azules",
      escudoUrl: "https://example.com/halcones.png",
    },
  ];

  const partidosMock: Partido[] = [
    {
      id: "p-1",
      localId: "eq-1",
      visitanteId: "eq-2",
      fecha: "2026-11-20T18:00:00Z",
      golesLocal: 2,
      golesVisitante: 0,
      jugado: true,
    },
    {
      id: "p-2",
      localId: "eq-2",
      visitanteId: "eq-1",
      fecha: "2026-11-27T18:00:00Z",
      golesLocal: null,
      golesVisitante: null,
      jugado: false,
    },
  ];

  it("1. Estructura semántica para lectores de pantalla: lee equipo (rowheader), puntos y posición", () => {
    render(
      <TablaPosiciones
        equiposIniciales={equiposMock}
        partidosIniciales={partidosMock}
        torneoNombre="Torneo Apertura 2026"
      />
    );

    // Tabla con caption accesible
    const tabla = screen.getByRole("table");
    expect(tabla).toBeInTheDocument();
    expect(
      screen.getByText(/Tabla de posiciones — Torneo Apertura 2026/i)
    ).toBeInTheDocument();

    // Encabezados de columna
    expect(
      screen.getByRole("columnheader", { name: /^pos/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("columnheader", { name: /^equipo$/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("columnheader", { name: /^pts/i })
    ).toBeInTheDocument();

    // Verificación de que el lector de pantalla lee el equipo como encabezado de fila (scope="row")
    const cabeceraFilaEquipo = screen.getByRole("rowheader", {
      name: /águilas doradas/i,
    });
    expect(cabeceraFilaEquipo).toBeInTheDocument();

    // La fila asocia la posición (1), el equipo ("Águilas Doradas") y los puntos (3)
    const fila = cabeceraFilaEquipo.closest("tr");
    expect(fila).not.toBeNull();
    if (fila) {
      const celdas = within(fila).getAllByRole("cell");
      // Primera celda: posición
      expect(celdas[0]).toHaveTextContent("1");
      // Encabezado de fila: nombre del equipo
      expect(
        within(fila).getByRole("rowheader", { name: /águilas doradas/i })
      ).toBeInTheDocument();
      // Última celda: puntos totales
      const celdaPuntos = celdas[celdas.length - 1];
      expect(celdaPuntos).toHaveTextContent("3");
    }
  });

  it("2. Ordenamiento accesible por columnas con actualización de aria-sort", () => {
    render(
      <TablaPosiciones
        equiposIniciales={equiposMock}
        partidosIniciales={partidosMock}
        torneoNombre="Torneo Apertura 2026"
      />
    );

    // Columna Puntos: inicialmente no ordenada explícitamente (aria-sort="none")
    const thPuntos = screen.getByRole("columnheader", { name: /^pts/i });
    expect(thPuntos).toHaveAttribute("aria-sort", "none");

    const botonOrdenarPuntos = within(thPuntos).getByRole("button", {
      name: /ordenar por puntos/i,
    });

    // Clic para ordenar por puntos descendente
    fireEvent.click(botonOrdenarPuntos);
    expect(thPuntos).toHaveAttribute("aria-sort", "descending");

    // Segundo clic para alternar a ascendente
    fireEvent.click(botonOrdenarPuntos);
    expect(thPuntos).toHaveAttribute("aria-sort", "ascending");
  });

  it("3. Validación de formulario con ResultadoInputSchema, errores con aria-describedby y aria-live", () => {
    render(
      <TablaPosiciones
        equiposIniciales={equiposMock}
        partidosIniciales={partidosMock}
        torneoNombre="Torneo Apertura 2026"
      />
    );

    // Consulta de controles por su etiqueta accesible
    const inputGolesLocal = screen.getByLabelText(/goles de halcones azules/i);
    const inputGolesVisitante = screen.getByLabelText(
      /goles de águilas doradas/i
    );
    const botonGuardar = screen.getByRole("button", {
      name: /guardar resultado/i,
    });

    // Ingresar valores inválidos (goles negativos)
    fireEvent.change(inputGolesLocal, { target: { value: "-1" } });
    fireEvent.change(inputGolesVisitante, { target: { value: "2" } });
    fireEvent.click(botonGuardar);

    // Debe mostrar alerta de error asociada al input mediante aria-describedby
    const mensajeError = screen.getByRole("alert");
    expect(mensajeError).toBeInTheDocument();
    expect(mensajeError).toHaveTextContent(/no pueden ser negativos/i);

    expect(inputGolesLocal).toHaveAttribute("aria-invalid", "true");
    expect(inputGolesLocal).toHaveAttribute(
      "aria-describedby",
      "error-goles-local"
    );
  });

  it("4. Recálculo en vivo de la tabla de posiciones al registrar un marcador válido", async () => {
    const user = userEvent.setup();

    render(
      <TablaPosiciones
        equiposIniciales={equiposMock}
        partidosIniciales={partidosMock}
        torneoNombre="Torneo Apertura 2026"
      />
    );

    // Seleccionamos el partido pendiente p-2 (Halcones vs Águilas)
    const selectPartido = screen.getByLabelText(/seleccionar partido/i);
    await user.selectOptions(selectPartido, "p-2");

    const inputGolesLocal = screen.getByLabelText(/goles de halcones azules/i);
    const inputGolesVisitante = screen.getByLabelText(
      /goles de águilas doradas/i
    );

    await user.clear(inputGolesLocal);
    await user.type(inputGolesLocal, "4");

    await user.clear(inputGolesVisitante);
    await user.type(inputGolesVisitante, "0");

    const botonGuardar = screen.getByRole("button", {
      name: /guardar resultado/i,
    });
    await user.click(botonGuardar);

    // Mensaje de estado
    expect(screen.getByRole("status")).toHaveTextContent(
      /marcador registrado exitosamente/i
    );

    // Ahora Halcones Azules ganó 4-0 a Águilas Doradas:
    // Águilas tiene 3 pts (2 pj, 1 pg, 1 pp, 2 gf, 4 gc -> dg -2)
    // Halcones tiene 3 pts (2 pj, 1 pg, 1 pp, 4 gf, 2 gc -> dg +2)
    // Por criterio de desempate dg (+2 vs -2), Halcones pasa a la posición 1
    const filaHalcones = screen
      .getByRole("rowheader", { name: /halcones azules/i })
      .closest("tr");
    expect(filaHalcones).not.toBeNull();
    if (filaHalcones) {
      const celdas = within(filaHalcones).getAllByRole("cell");
      expect(celdas[0]).toHaveTextContent("1");
    }
  });
});
