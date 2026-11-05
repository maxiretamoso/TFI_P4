// Valores tomados de la tabla usuarios de incidencias_db.sql
const ROLES = Object.freeze({
  DIRECTOR: 1,
  EMPLEADO_SISTEMAS: 2,
  EMPLEADO_MUNICIPAL: 3,
});

const NOMBRES_ROL = Object.freeze({
  [ROLES.DIRECTOR]: "Director del área de Sistemas",
  [ROLES.EMPLEADO_SISTEMAS]: "Empleado del área de Sistemas",
  [ROLES.EMPLEADO_MUNICIPAL]: "Empleado Municipal",
});

module.exports = { ROLES, NOMBRES_ROL };
