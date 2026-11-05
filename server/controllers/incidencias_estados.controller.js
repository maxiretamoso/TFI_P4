import * as historialService from "../services/incidencias_estados.service.js";

async function listar(req, res, next) {
  try {
    res.json(await historialService.listarHistorial());
  } catch (error) {
    next(error);
  }
}

export { listar };
