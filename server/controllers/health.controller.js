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
    console.error(error);
    res.status(500).json({
      status: "error",
      database: "desconectada",
      error: error.message,
    });
  }
}

module.exports = { verificarSalud };
