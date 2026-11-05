import * as avataresService from "../services/avatares.service.js";

function listar(req, res) {
  res.json(avataresService.listarPredefinidos());
}

export { listar };
