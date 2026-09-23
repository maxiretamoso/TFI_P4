/**
 * Helper para errores HTTP con status code.
 * Los services lanzan estos errores y el manejador centralizado de
 * server/index.js los convierte en `res.status(err.status).json({ error: err.message })`.
 * Reutilizable por todos los agentes del refactor (ver NOTAS_REFACTOR_AGENTE2.md).
 *
 * Uso:
 *   const { crearError } = require("../utils/httpError");
 *   throw crearError(404, "Artículo no encontrado");
 */
function crearError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

module.exports = { crearError };
