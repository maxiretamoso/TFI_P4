const incidenciasEstadosService = require("../services/incidencias_estados.service");

async function listar(req, res, next) {
  try {
    res.json(await incidenciasEstadosService.listarHistorial());
  } catch (e) {
    next(e);
  }
}

module.exports = { listar };
