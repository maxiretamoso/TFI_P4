import * as dashboardService from "../services/dashboard.service.js";

async function obtenerResumen(req, res) {
  res.json(await dashboardService.obtenerResumen());
}

export { obtenerResumen };
