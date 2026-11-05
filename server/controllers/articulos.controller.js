import { responderSiHayErroresDeValidacion } from "../utils/validar.js";
import * as articulosService from "../services/articulos.service.js";

async function listar(req, res, next) {
  if (responderSiHayErroresDeValidacion(req, res)) return;
  try {
    res.json(await articulosService.listarArticulos());
  } catch (error) {
    next(error);
  }
}

async function obtenerPorId(req, res, next) {
  if (responderSiHayErroresDeValidacion(req, res)) return;
  try {
    res.json(await articulosService.obtenerArticuloPorId(req.params.id));
  } catch (error) {
    next(error);
  }
}

async function crear(req, res, next) {
  if (responderSiHayErroresDeValidacion(req, res)) return;
  try {
    const { id_area, id_categoria, descripcion } = req.body;
    res.status(201).json(await articulosService.crearArticulo({ id_area, id_categoria, descripcion }));
  } catch (error) {
    next(error);
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
  } catch (error) {
    next(error);
  }
}

async function eliminar(req, res, next) {
  if (responderSiHayErroresDeValidacion(req, res)) return;
  try {
    await articulosService.desactivarArticulo(req.params.id);
    res.status(204).end();
  } catch (error) {
    next(error);
  }
}

export { listar, obtenerPorId, crear, actualizar, eliminar };
