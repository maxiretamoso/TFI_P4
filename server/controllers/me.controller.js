import * as meService from "../services/me.service.js";

async function obtenerPerfil(req, res) {
  res.json(await meService.obtenerPerfil(req.usuario.id_usuario));
}

export { obtenerPerfil };
