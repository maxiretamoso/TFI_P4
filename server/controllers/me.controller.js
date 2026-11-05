import * as meService from "../services/me.service.js";

async function obtenerPerfil(req, res, next) {
  try {
    res.json(await meService.obtenerPerfil(req.usuario.id_usuario));
  } catch (error) {
    next(error);
  }
}

export { obtenerPerfil };
