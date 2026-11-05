// Valores tomados de la tabla estados de incidencias_db.sql
const ESTADOS = Object.freeze({
  PENDIENTE: 1,
  EN_PROCESO: 2,
  RESUELTA: 3,
  CANCELADA: 4,
});

module.exports = { ESTADOS };
