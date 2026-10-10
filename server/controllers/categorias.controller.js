const categoriasService = require("../services/categorias.service");
const { responderSiHayErroresDeValidacion } = require("../utils/validar");

async function listar(req, res, next) {
  try {
    res.json(await categoriasService.listarCategorias());
  } catch (e) { next(e); }
}

async function obtenerPorId(req, res, next) {
  try {
    const categoria = await categoriasService.obtenerCategoriaPorId(req.params.id);
    res.json(categoria);
  } catch (e) { next(e); }
}

async function crear(req, res, next) {
  if (responderSiHayErroresDeValidacion(req, res)) return;
  try {
    res.status(201).json(await categoriasService.crearCategoria(req.body.descripcion));
  } catch (e) { next(e); }
}

async function actualizar(req, res, next) {
  if (responderSiHayErroresDeValidacion(req, res)) return;
  try {
    const categoria = await categoriasService.actualizarCategoria(req.params.id, req.body.descripcion);
    res.json(categoria);
  } catch (e) { next(e); }
}

async function eliminar(req, res, next) {
  try {
    const categoria = await categoriasService.desactivarCategoria(req.params.id);
    res.json({ mensaje: "Categoría desactivada", categoria });
  } catch (e) { next(e); }
}

module.exports = { listar, obtenerPorId, crear, actualizar, eliminar };
