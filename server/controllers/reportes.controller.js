const reportesService = require("../services/reportes.service");
const { crearReporteIncidencias } = require("../utils/reportePdf");

async function generarReporteIncidencias(req, res, next) {
  try {
    const datos = await reportesService.obtenerDatosReporte();
    const doc = crearReporteIncidencias(datos);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", 'attachment; filename="reporte-incidencias.pdf"');
    doc.pipe(res);
    doc.end();
  } catch (error) {
    next(error);
  }
}

module.exports = { generarReporteIncidencias };
