const { validationResult } = require("express-validator");

// Devuelve true si ya respondió con 400; el controlador debe cortar ahí.
function responderSiHayErroresDeValidacion(req, res) {
  const errores = validationResult(req);
  if (!errores.isEmpty()) {
    res.status(400).json({ errors: errores.array() });
    return true;
  }
  return false;
}

module.exports = { responderSiHayErroresDeValidacion };
