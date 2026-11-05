const meService = require("../services/me.service");

async function obtenerPerfil(req, res, next) {
  try {
    res.json(await meService.obtenerPerfil(req.usuario.id_usuario));
  } catch (error) {
    next(error);
  }
}

module.exports = { obtenerPerfil };
