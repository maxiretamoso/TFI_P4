import * as dashboardDatos from "../datos/dashboard.datos.js";
import * as reportesDatos from "../datos/reportes.datos.js";
import { ESTADOS } from "../config/estados.js";
import { ROLES } from "../config/roles.js";

const FECHAS_DEL_LISTADO = 7;
const PRIORIDAD_ALTA = 3;
const MAXIMO_PRIORITARIAS = 10;
const SIN_RESOLVER = [ESTADOS.PENDIENTE, ESTADOS.EN_PROCESO];

async function obtenerResumen() {
  const [
    total,
    porEstado,
    porFecha,
    porPrioridad,
    porArea,
    porCategoria,
    prioritarias,
    cargaPorEmpleado,
  ] = await Promise.all([
    dashboardDatos.total(),
    dashboardDatos.totalesPorEstado(),
    dashboardDatos.totalesPorFecha(FECHAS_DEL_LISTADO),
    reportesDatos.totalesPorPrioridad(),
    reportesDatos.totalesPorArea(),
    dashboardDatos.totalesPorCategoria(),
    dashboardDatos.prioritarias({
      prioridad: PRIORIDAD_ALTA,
      estados: SIN_RESOLVER,
      limite: MAXIMO_PRIORITARIAS,
    }),
    dashboardDatos.cargaPorEmpleado({
      rolSistemas: ROLES.EMPLEADO_SISTEMAS,
      enProceso: ESTADOS.EN_PROCESO,
      resuelta: ESTADOS.RESUELTA,
      cancelada: ESTADOS.CANCELADA,
    }),
  ]);

  return {
    total,
    porEstado,
    porFecha,
    porPrioridad,
    porArea,
    porCategoria,
    prioritarias,
    cargaPorEmpleado,
  };
}

export { obtenerResumen };
