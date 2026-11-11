// Valores de referencia
const AREA_SISTEMAS = 3;

const ROLES = Object.freeze({
  DIRECTOR: 1,
  EMPLEADO_SISTEMAS: 2,
  EMPLEADO_MUNICIPAL: 3,
});

const ESTADOS = Object.freeze({
  PENDIENTE: 1,
  EN_PROCESO: 2,
  RESUELTA: 3,
  CANCELADA: 4,
});

const SIN_RESOLVER = Object.freeze([ESTADOS.PENDIENTE, ESTADOS.EN_PROCESO]);

const PRIORIDAD_ALTA = 3;
const PRIORIDADES = Object.freeze({
  1: "Baja",
  2: "Media",
  [PRIORIDAD_ALTA]: "Alta",
});

const PREFIJO_API = "/api/v1";

const REPORTES = Object.freeze({
  pendientes: { etiqueta: "Pendientes", titulo: "Incidencias pendientes", estados: [ESTADOS.PENDIENTE] },
  en_proceso: { etiqueta: "En proceso", titulo: "Incidencias en proceso", estados: [ESTADOS.EN_PROCESO] },
  resueltas: { etiqueta: "Resueltas", titulo: "Incidencias resueltas", estados: [ESTADOS.RESUELTA] },
  canceladas: { etiqueta: "Canceladas", titulo: "Incidencias canceladas", estados: [ESTADOS.CANCELADA] },
});
const FILTROS_DE_REPORTE = Object.freeze(Object.keys(REPORTES));

const ZONA_HORARIA = "America/Argentina/Buenos_Aires";

export {
  PREFIJO_API,
  REPORTES,
  FILTROS_DE_REPORTE,
  AREA_SISTEMAS,
  ROLES,
  ESTADOS,
  SIN_RESOLVER,
  PRIORIDADES,
  PRIORIDAD_ALTA,
  ZONA_HORARIA,
};
