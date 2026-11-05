const dashboardDatos = require("../datos/dashboard.datos");
const reportesDatos = require("../datos/reportes.datos");
const { ESTADOS } = require("../config/estados");
const { ROLES } = require("../config/roles");

const FECHAS_DEL_LISTADO = 7;
const PRIORIDAD_ALTA = 3;
const MAXIMO_PRIORITARIAS = 10;
const ABIERTOS = [ESTADOS.PENDIENTE, ESTADOS.EN_PROCESO];

async function obtenerResumen() {
  const [
    total,
    porEstado,
    porFecha,
    porPrioridad,
    porArea,
    porCategoria,
    indicadores,
    prioritarias,
    cargaPorEmpleado,
  ] = await Promise.all([
    dashboardDatos.total(),
    dashboardDatos.totalesPorEstado(),
    dashboardDatos.totalesPorFecha(FECHAS_DEL_LISTADO),
    reportesDatos.totalesPorPrioridad(),
    reportesDatos.totalesPorArea(),
    dashboardDatos.totalesPorCategoria(),
    dashboardDatos.indicadores({
      abiertos: ABIERTOS,
      prioridadAlta: PRIORIDAD_ALTA,
      pendiente: ESTADOS.PENDIENTE,
      rolDirector: ROLES.DIRECTOR,
    }),
    dashboardDatos.prioritarias({
      prioridad: PRIORIDAD_ALTA,
      abiertos: ABIERTOS,
      limite: MAXIMO_PRIORITARIAS,
    }),
    dashboardDatos.cargaPorEmpleado({
      rolSistemas: ROLES.EMPLEADO_SISTEMAS,
      abiertos: ABIERTOS,
      resuelta: ESTADOS.RESUELTA,
    }),
  ]);

  return {
    total,
    indicadores,
    porEstado,
    porFecha,
    porPrioridad,
    porArea,
    porCategoria,
    prioritarias,
    cargaPorEmpleado,
  };
}

module.exports = { obtenerResumen };
