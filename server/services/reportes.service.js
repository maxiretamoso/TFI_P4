const reportesDatos = require("../datos/reportes.datos");

async function obtenerDatosReporte() {
  const [porEstado, porPrioridad, porArea, detalle] = await Promise.all([
    reportesDatos.totalesPorEstado(),
    reportesDatos.totalesPorPrioridad(),
    reportesDatos.totalesPorArea(),
    reportesDatos.detalle(),
  ]);

  return { porEstado, porPrioridad, porArea, detalle };
}

module.exports = { obtenerDatosReporte };
