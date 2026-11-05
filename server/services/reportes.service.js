const reportesDatos = require("../datos/reportes.datos");
const { ESTADOS } = require("../config/estados");

const FILTROS = {
  pendientes: { titulo: "Incidencias pendientes", estados: [ESTADOS.PENDIENTE] },
  en_proceso: { titulo: "Incidencias en proceso", estados: [ESTADOS.EN_PROCESO] },
  resueltas: { titulo: "Incidencias resueltas", estados: [ESTADOS.RESUELTA] },
  canceladas: { titulo: "Incidencias canceladas", estados: [ESTADOS.CANCELADA] },
};
const SIN_FILTRO = { titulo: "Todas las incidencias", estados: null };

async function obtenerDatosReporte(filtro) {
  const { titulo, estados } = FILTROS[filtro] ?? SIN_FILTRO;
  const [porEstado, porPrioridad, porArea, detalle] = await Promise.all([
    reportesDatos.totalesPorEstado(estados),
    reportesDatos.totalesPorPrioridad(estados),
    reportesDatos.totalesPorArea(estados),
    reportesDatos.detalle(estados),
  ]);

  return { titulo, porEstado, porPrioridad, porArea, detalle };
}

module.exports = { obtenerDatosReporte, FILTROS_DE_REPORTE: Object.keys(FILTROS) };
