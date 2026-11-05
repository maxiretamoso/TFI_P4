const avataresService = require("../services/avatares.service");

function listar(req, res) {
  res.json(avataresService.listarPredefinidos());
}

module.exports = { listar };
