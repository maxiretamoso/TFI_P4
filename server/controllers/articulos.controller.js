const { responderSiHayErroresDeValidacion } = require("../utils/validar");
const articulosService = require("../services/articulos.service");

async function listar(req, res, next) {
  try {
    res.json(await articulosService.listarArticulos());
  } catch (e) {
    next(e);
  }
}

async function obtenerPorId(req, res, next) {
  try {
    res.json(await articulosService.obtenerArticuloPorId(req.params.id));
  } catch (e) {
    next(e);
  }
}

async function crear(req, res, next) {
  if (responderSiHayErroresDeValidacion(req, res)) return;
  try {
    const { id_area, id_categoria, descripcion } = req.body;
    res.status(201).json(await articulosService.crearArticulo({ id_area, id_categoria, descripcion }));
  } catch (e) {
    next(e);
  }
}

async function actualizar(req, res, next) {
  if (responderSiHayErroresDeValidacion(req, res)) return;
  try {
    res.json(
      await articulosService.actualizarArticulo(req.params.id, {
        id_area: req.body.id_area,
        id_categoria: req.body.id_categoria,
        descripcion: req.body.descripcion,
      }),
    );
  } catch (e) {
    next(e);
  }
}

async function eliminar(req, res, next) {
  try {
    const articulo = await articulosService.desactivarArticulo(req.params.id);
    res.json({ mensaje: "Artículo desactivado", articulo });
  } catch (e) {
    next(e);
  }
}

module.exports = { listar, obtenerPorId, crear, actualizar, eliminar };
