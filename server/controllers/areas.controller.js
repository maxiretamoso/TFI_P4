const areasService = require("../services/areas.service");
const { responderSiHayErroresDeValidacion } = require("../utils/validar");

async function listar(req, res, next) {
  try {
    res.json(await areasService.listarAreas());
  } catch (e) { next(e); }
}

async function obtenerPorId(req, res, next) {
  try {
    const area = await areasService.obtenerAreaPorId(req.params.id);
    if (!area) return res.status(404).json({ error: "Área no encontrada" });
    res.json(area);
  } catch (e) { next(e); }
}

async function crear(req, res, next) {
  if (responderSiHayErroresDeValidacion(req, res)) return;
  try {
    res.status(201).json(await areasService.crearArea(req.body.descripcion));
  } catch (e) { next(e); }
}

async function actualizar(req, res, next) {
  if (responderSiHayErroresDeValidacion(req, res)) return;
  try {
    const area = await areasService.actualizarArea(req.params.id, req.body.descripcion);
    if (!area) return res.status(404).json({ error: "Área no encontrada" });
    res.json(area);
  } catch (e) { next(e); }
}

async function eliminar(req, res, next) {
  try {
    const area = await areasService.desactivarArea(req.params.id);
    if (!area) return res.status(404).json({ error: "Área no encontrada" });
    res.json({ mensaje: "Área desactivada", area });
  } catch (e) { next(e); }
}

module.exports = { listar, obtenerPorId, crear, actualizar, eliminar };
