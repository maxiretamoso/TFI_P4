const meService = require("../services/me.service");

async function obtenerPerfil(req, res, next) {
  try {
    const perfil = await meService.obtenerPerfil(req.usuario.id_usuario);
    if (!perfil) return res.status(404).json({ error: "Usuario no encontrado" });
    res.json(perfil);
  } catch (e) {
    if (e.status) return next(e);
    const generico = new Error("Error al obtener el perfil");
    generico.status = 500;
    next(generico);
  }
}

module.exports = { obtenerPerfil };
