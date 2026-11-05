const dashboardDatos = require("../datos/dashboard.datos");

const DIAS_DEL_GRAFICO = 30;
const PRIORIDAD_ALTA = 3;
const MAXIMO_PRIORITARIAS = 20;

async function obtenerResumen() {
  const [total, porEstado, porFecha, prioritarias] = await Promise.all([
    dashboardDatos.total(),
    dashboardDatos.totalesPorEstado(),
    dashboardDatos.totalesPorFecha(DIAS_DEL_GRAFICO),
    dashboardDatos.prioritarias(PRIORIDAD_ALTA, MAXIMO_PRIORITARIAS),
  ]);

  return { total, porEstado, porFecha, prioritarias };
}

module.exports = { obtenerResumen };
