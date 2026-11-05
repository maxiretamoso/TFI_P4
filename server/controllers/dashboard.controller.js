import * as dashboardService from "../services/dashboard.service.js";

async function obtenerResumen(req, res, next) {
  try {
    res.json(await dashboardService.obtenerResumen());
  } catch (error) {
    next(error);
  }
}

export { obtenerResumen };
