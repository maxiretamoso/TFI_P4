const estadosService = require("../services/estados.service");
const { responderSiHayErroresDeValidacion } = require("../utils/validar");

async function listar(req, res, next) {
  try {
    res.json(await estadosService.listarEstados());
  } catch (error) {
    next(error);
  }
}

async function obtenerPorId(req, res, next) {
  try {
    const estado = await estadosService.obtenerEstadoPorId(req.params.id);
    res.json(estado);
  } catch (error) {
    next(error);
  }
}

async function crear(req, res, next) {
  if (responderSiHayErroresDeValidacion(req, res)) return;
  try {
    res.status(201).json(await estadosService.crearEstado(req.body.descripcion));
  } catch (error) {
    next(error);
  }
}

async function actualizar(req, res, next) {
  if (responderSiHayErroresDeValidacion(req, res)) return;
  try {
    const estado = await estadosService.actualizarEstado(req.params.id, req.body.descripcion);
    res.json(estado);
  } catch (error) {
    next(error);
  }
}

async function eliminar(req, res, next) {
  try {
    await estadosService.desactivarEstado(req.params.id);
    res.status(204).end();
  } catch (error) {
    next(error);
  }
}

module.exports = { listar, obtenerPorId, crear, actualizar, eliminar };
