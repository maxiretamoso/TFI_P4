const healthService = require("../services/health.service");

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
    // El detalle se queda solo en el servidor: error.message de Postgres
    // puede filtrar datos sensibles y /health no tiene autenticación.
    // 503 (Service Unavailable) además es el código correcto, no 500.
    console.error(error);
    res.status(503).json({
      status: "error",
      database: "desconectada",
    });
  }
}

module.exports = { verificarSalud };
