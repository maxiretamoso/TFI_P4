const estadosService = require("../services/estados.service");
const { responderSiHayErroresDeValidacion } = require("../utils/validar");

async function listar(req, res, next) {
  try {
    res.json(await estadosService.listarEstados());
  } catch (e) { next(e); }
}

async function obtenerPorId(req, res, next) {
  try {
    const estado = await estadosService.obtenerEstadoPorId(req.params.id);
    if (!estado) return res.status(404).json({ error: "Estado no encontrado" });
    res.json(estado);
  } catch (e) { next(e); }
}

async function crear(req, res, next) {
  if (responderSiHayErroresDeValidacion(req, res)) return;
  try {
    res.status(201).json(await estadosService.crearEstado(req.body.descripcion));
  } catch (e) { next(e); }
}

async function actualizar(req, res, next) {
  if (responderSiHayErroresDeValidacion(req, res)) return;
  try {
    const estado = await estadosService.actualizarEstado(req.params.id, req.body.descripcion);
    if (!estado) return res.status(404).json({ error: "Estado no encontrado" });
    res.json(estado);
  } catch (e) { next(e); }
}

async function eliminar(req, res, next) {
  try {
    const estado = await estadosService.desactivarEstado(req.params.id);
    if (!estado) return res.status(404).json({ error: "Estado no encontrado" });
    res.json({ mensaje: "Estado desactivado", estado });
  } catch (e) { next(e); }
}

module.exports = { listar, obtenerPorId, crear, actualizar, eliminar };
