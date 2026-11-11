import * as reportesDatos from "../datos/reportes.datos.js";
import { REPORTES } from "../../shared/constantes.js";

const SIN_FILTRO = { titulo: "Todas las incidencias", estados: null };

async function obtenerDatosReporte(filtro) {
  const { titulo, estados } = REPORTES[filtro] ?? SIN_FILTRO;
  const [porEstado, porPrioridad, porArea, detalle] = await Promise.all([
    reportesDatos.totalesPorEstado(estados),
    reportesDatos.totalesPorPrioridad(estados),
    reportesDatos.totalesPorArea(estados),
    reportesDatos.detalle(estados),
  ]);

  return { titulo, porEstado, porPrioridad, porArea, detalle };
}

export { obtenerDatosReporte };
