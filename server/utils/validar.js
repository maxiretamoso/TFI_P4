const { validationResult } = require("express-validator");

/**
 * Revisa los errores de express-validator y, si los hay,
 * responde 400 con `{ errors: [...] }` (mismo formato original).
 *
 * Uso en controllers:
 *   const { responderSiHayErroresDeValidacion } = require("../utils/validar");
 *   if (responderSiHayErroresDeValidacion(req, res)) return;
 *
 * Devuelve true si ya respondió (el controller debe hacer return),
 * false si no hay errores y debe seguir.
 */
function responderSiHayErroresDeValidacion(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return true;
  }
  return false;
}

module.exports = { responderSiHayErroresDeValidacion };
