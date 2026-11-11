import { validationResult } from "express-validator";

// express-validator usa "Invalid value" cuando la regla no tiene mensaje propio.
const MENSAJE_POR_DEFECTO = "Invalid value";

function enCastellano(error) {
  if (error.msg !== MENSAJE_POR_DEFECTO) return error;
  return { ...error, msg: `El dato "${error.path}" no es válido` };
}

// Devuelve true si ya respondió con 400; el controlador debe cortar ahí.
function responderSiHayErroresDeValidacion(req, res) {
  const errores = validationResult(req);
  if (!errores.isEmpty()) {
    res.status(400).json({ errors: errores.array().map(enCastellano) });
    return true;
  }
  return false;
}

export { responderSiHayErroresDeValidacion };
