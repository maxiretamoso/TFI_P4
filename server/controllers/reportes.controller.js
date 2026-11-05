const PDFDocument = require("pdfkit");
const reportesService = require("../services/reportes.service");
const { ESTADOS } = require("../config/estados");

const PRIORIDADES = { 1: "Baja", 2: "Media", 3: "Alta" };

function escribirSeccion(doc, titulo, filas) {
  doc.moveDown(0.8);
  doc.fontSize(12).fillColor("#0d4d7a").text(titulo);
  doc.moveDown(0.2);
  doc.fontSize(10).fillColor("#222");

  if (filas.length === 0) {
    doc.text("Sin datos.");
    return;
  }
  filas.forEach((fila) => doc.text(`• ${fila}`));
}

async function generarReporteIncidencias(req, res, next) {
  try {
    const { porEstado, porPrioridad, porArea, detalle } = await reportesService.obtenerDatosReporte();

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", 'attachment; filename="reporte-incidencias.pdf"');

    const doc = new PDFDocument({ margin: 45, size: "A4" });
    doc.pipe(res);

    doc.fontSize(18).fillColor("#0d4d7a").text("Reporte de Incidencias", { align: "center" });
    doc.fontSize(9).fillColor("#666")
      .text(`Generado el ${new Date().toLocaleString("es-AR")}`, { align: "center" });
    doc.moveDown();

    escribirSeccion(doc, "Totales por estado", porEstado.map((f) => `${f.estado}: ${f.total}`));
    escribirSeccion(doc, "Totales por prioridad",
      porPrioridad.map((f) => `${PRIORIDADES[f.prioridad] || f.prioridad}: ${f.total}`));
    escribirSeccion(doc, "Totales por área del artículo", porArea.map((f) => `${f.area}: ${f.total}`));

    const resueltas = detalle.filter((i) => i.id_estado === ESTADOS.RESUELTA).length;
    escribirSeccion(doc, "Resumen", [
      `Incidencias registradas: ${detalle.length}`,
      `Resueltas: ${resueltas}`,
    ]);

    doc.addPage();
    doc.fontSize(14).fillColor("#0d4d7a").text("Detalle de incidencias");
    doc.moveDown(0.5).fontSize(9).fillColor("#222");

    detalle.forEach((inc) => {
      const fecha = new Date(inc.creado).toLocaleDateString("es-AR");
      doc.text(
        `#${inc.id_incidencia} · ${fecha} · ${inc.articulo} · ${inc.estado} · ` +
        `${PRIORIDADES[inc.prioridad] || inc.prioridad} · ${inc.asignado_apellidos} ${inc.asignado_nombres}`
      );
    });

    doc.end();
  } catch (error) {
    next(error);
  }
}

module.exports = { generarReporteIncidencias };
