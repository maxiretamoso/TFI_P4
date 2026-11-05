const categoriasService = require("../services/categorias.service");
const { responderSiHayErroresDeValidacion } = require("../utils/validar");

async function listar(req, res, next) {
  if (responderSiHayErroresDeValidacion(req, res)) return;
  try {
    res.json(await categoriasService.listarCategorias());
  } catch (error) {
    next(error);
  }
}

async function obtenerPorId(req, res, next) {
  if (responderSiHayErroresDeValidacion(req, res)) return;
  try {
    const categoria = await categoriasService.obtenerCategoriaPorId(req.params.id);
    res.json(categoria);
  } catch (error) {
    next(error);
  }
}

async function crear(req, res, next) {
  if (responderSiHayErroresDeValidacion(req, res)) return;
  try {
    res.status(201).json(await categoriasService.crearCategoria(req.body.descripcion));
  } catch (error) {
    next(error);
  }
}

async function actualizar(req, res, next) {
  if (responderSiHayErroresDeValidacion(req, res)) return;
  try {
    const categoria = await categoriasService.actualizarCategoria(req.params.id, req.body.descripcion);
    res.json(categoria);
  } catch (error) {
    next(error);
  }
}

async function eliminar(req, res, next) {
  if (responderSiHayErroresDeValidacion(req, res)) return;
  try {
    await categoriasService.desactivarCategoria(req.params.id);
    res.status(204).end();
  } catch (error) {
    next(error);
  }
}

module.exports = { listar, obtenerPorId, crear, actualizar, eliminar };
