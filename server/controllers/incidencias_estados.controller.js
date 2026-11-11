import * as historialService from "../services/incidencias_estados.service.js";

async function listar(req, res) {
  res.json(await historialService.listarHistorial());
}

export { listar };
