const dashboardDatos = require("../datos/dashboard.datos");
const reportesDatos = require("../datos/reportes.datos");

const DIAS_DEL_GRAFICO = 14;

async function obtenerResumen() {
  const [total, porEstado, porFecha, porPrioridad, porArea] = await Promise.all([
    dashboardDatos.total(),
    dashboardDatos.totalesPorEstado(),
    dashboardDatos.totalesPorFecha(DIAS_DEL_GRAFICO),
    reportesDatos.totalesPorPrioridad(),
    reportesDatos.totalesPorArea(),
  ]);

  return { total, porEstado, porFecha, porPrioridad, porArea, dias: DIAS_DEL_GRAFICO };
}

module.exports = { obtenerResumen };
