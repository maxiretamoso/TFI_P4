const authService = require("../services/auth.service");
const { responderSiHayErroresDeValidacion } = require("../utils/validar");

async function login(req, res, next) {
  if (responderSiHayErroresDeValidacion(req, res)) return;
  try {
    res.json(await authService.login(req.body.usuario, req.body.contrasenia));
  } catch (error) {
    next(error);
  }
}

async function cambiarContrasenia(req, res, next) {
  if (responderSiHayErroresDeValidacion(req, res)) return;
  try {
    res.json(
      await authService.cambiarContrasenia(
        req.usuario.id_usuario,
        req.body.contrasenia_actual,
        req.body.contrasenia_nueva
      )
    );
  } catch (error) {
    next(error);
  }
}

module.exports = { login, cambiarContrasenia };
