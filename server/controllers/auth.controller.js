import * as authService from "../services/auth.service.js";
import { responderSiHayErroresDeValidacion } from "../utils/validarSolicitud.js";

async function login(req, res) {
  if (responderSiHayErroresDeValidacion(req, res)) return;
  res.json(await authService.login(req.body.usuario, req.body.contrasenia));
}

async function cambiarContrasenia(req, res) {
  if (responderSiHayErroresDeValidacion(req, res)) return;
  res.json(
    await authService.cambiarContrasenia(
      req.usuario.id_usuario,
      req.body.contrasenia_actual,
      req.body.contrasenia_nueva
    )
  );
}

export { login, cambiarContrasenia };
