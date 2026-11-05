import * as reportesService from "../services/reportes.service.js";
import { crearReporteIncidencias } from "../utils/reportePdf.js";
import { responderSiHayErroresDeValidacion } from "../utils/validar.js";

async function generarReporteIncidencias(req, res, next) {
  if (responderSiHayErroresDeValidacion(req, res)) return;
  try {
    const filtro = req.query.filtro;
    const datos = await reportesService.obtenerDatosReporte(filtro);
    const doc = crearReporteIncidencias(datos);
    const nombre = filtro ? `reporte-incidencias-${filtro}.pdf` : "reporte-incidencias.pdf";

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${nombre}"`);
    doc.pipe(res);
    doc.end();
  } catch (error) {
    next(error);
  }
}

export { generarReporteIncidencias };
