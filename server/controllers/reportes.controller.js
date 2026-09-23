const PDFDocument = require("pdfkit");
const reportesService = require("../services/reportes.service");

async function generarReporteIncidencias(req, res, next) {
  try {
    const { porEstado, porPrioridad, porArea } = await reportesService.obtenerDatosReporte();

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "inline; filename=reporte-incidencias.pdf");

    const doc = new PDFDocument({ margin: 40 });
    doc.pipe(res);

    doc.fontSize(18).text("Reporte de Incidencias", { align: "center" });
    doc.moveDown();
    doc.fontSize(10).text(`Generado: ${new Date().toLocaleString()}`, { align: "right" });
    doc.moveDown();

    doc.fontSize(12).text("Totales por estado:", { underline: true });
    porEstado.forEach(r => doc.fontSize(10).text(`- ${r.estado}: ${r.total}`));
    doc.moveDown();

    doc.fontSize(12).text("Por prioridad:", { underline: true });
    porPrioridad.forEach(r => doc.fontSize(10).text(`- Prioridad ${r.prioridad}: ${r.total}`));
    doc.moveDown();

    doc.fontSize(12).text("Por área del artículo:", { underline: true });
    porArea.forEach(r => doc.fontSize(10).text(`- ${r.area}: ${r.total}`));
    doc.moveDown();

    doc.fontSize(8).text("Sistema de Incidencias - TFI P4", { align: "center" });
    doc.end();
  } catch (e) {
    next(e);
  }
}

module.exports = { generarReporteIncidencias };
