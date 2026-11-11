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

const ZONA_HORARIA = "America/Argentina/Buenos_Aires";

export {
  AREA_SISTEMAS,
  ROLES,
  ESTADOS,
  SIN_RESOLVER,
  PRIORIDADES,
  PRIORIDAD_ALTA,
  ZONA_HORARIA,
};
