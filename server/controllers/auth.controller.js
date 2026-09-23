const authService = require("../services/auth.service");
const { responderSiHayErroresDeValidacion } = require("../utils/validar");

async function login(req, res, next) {
  if (responderSiHayErroresDeValidacion(req, res)) return;
  try {
    res.json(await authService.login(req.body.usuario, req.body.contrasenia));
  } catch (e) {
    if (e.status) return next(e);
    console.error(e);
    const generico = new Error("Error al iniciar sesión");
    generico.status = 500;
    next(generico);
  }
}

async function register(req, res, next) {
  if (responderSiHayErroresDeValidacion(req, res)) return;
  try {
    res.status(201).json(await authService.register(req.body, req.usuario));
  } catch (e) {
    if (e.status) return next(e);
    console.error(e);
    const generico = new Error("Error al registrar usuario");
    generico.status = 500;
    next(generico);
  }
}

module.exports = { login, register };
