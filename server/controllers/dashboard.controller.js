const dashboardService = require("../services/dashboard.service");

async function obtenerResumen(req, res, next) {
  try {
    res.json(await dashboardService.obtenerResumen());
  } catch (e) {
    next(e);
  }
}

module.exports = { obtenerResumen };
