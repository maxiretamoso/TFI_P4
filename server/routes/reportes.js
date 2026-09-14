const express = require("express");
const router = express.Router();
const pool = require("../db");
const verificarToken = require("../middlewares/verificarToken");
const verificarRol = require("../middlewares/verificarRol");
const PDFDocument = require("pdfkit");

/**
 * @swagger
 * /api/v1/reportes/incidencias:
 *   get:
 *     summary: Genera PDF con estadísticas de incidencias (solo Director)
 *     tags: [Reportes]
 *     security: [{ bearerAuth: [] }]
 */
router.get("/incidencias", verificarToken, verificarRol(3), async (req, res, next) => {
  try {
    const porEstado = await pool.query(`
      SELECT estados.descripcion AS estado, COUNT(*)::int AS total
      FROM incidencias JOIN estados ON incidencias.id_estado=estados.id_estado
      GROUP BY estados.descripcion ORDER BY total DESC`);
    const porPrioridad = await pool.query(`SELECT prioridad, COUNT(*)::int AS total FROM incidencias GROUP BY prioridad ORDER BY prioridad`);
    const porArea = await pool.query(`
      SELECT areas.descripcion AS area, COUNT(*)::int AS total
      FROM incidencias JOIN articulos ON incidencias.articulo=articulos.id_articulo JOIN areas ON articulos.id_area=areas.id_area
      GROUP BY areas.descripcion`);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "inline; filename=reporte-incidencias.pdf");

    const doc = new PDFDocument({ margin: 40 });
    doc.pipe(res);

    doc.fontSize(18).text("Reporte de Incidencias", { align: "center" });
    doc.moveDown();
    doc.fontSize(10).text(`Generado: ${new Date().toLocaleString()}`, { align: "right" });
    doc.moveDown();

    doc.fontSize(12).text("Totales por estado:", { underline: true });
    porEstado.rows.forEach(r => doc.fontSize(10).text(`- ${r.estado}: ${r.total}`));
    doc.moveDown();

    doc.fontSize(12).text("Por prioridad:", { underline: true });
    porPrioridad.rows.forEach(r => doc.fontSize(10).text(`- Prioridad ${r.prioridad}: ${r.total}`));
    doc.moveDown();

    doc.fontSize(12).text("Por área del artículo:", { underline: true });
    porArea.rows.forEach(r => doc.fontSize(10).text(`- ${r.area}: ${r.total}`));
    doc.moveDown();

    doc.fontSize(8).text("Sistema de Incidencias - TFI P4", { align: "center" });
    doc.end();
  } catch (e) { next(e); }
});

module.exports = router;
