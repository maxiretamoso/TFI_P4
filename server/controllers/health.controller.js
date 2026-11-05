import * as healthService from "../services/health.service.js";

async function verificarSalud(req, res) {
  try {
    await healthService.verificarConexion();
    res.json({
      status: "ok",
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      database: "conectada",
    });
  } catch (error) {
    // El detalle queda en el servidor: /health no pide autenticación.
    console.error(error);
    res.status(503).json({
      status: "error",
      database: "desconectada",
    });
  }
}

export { verificarSalud };
