const dashboardService = require("../services/dashboard.service");

async function obtenerResumen(req, res, next) {
  try {
    res.json(await dashboardService.obtenerResumen());
  } catch (error) {
    next(error);
  }
}

module.exports = { obtenerResumen };
