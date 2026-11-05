import * as areasService from "../services/areas.service.js";
import { responderSiHayErroresDeValidacion } from "../utils/validar.js";

async function listar(req, res, next) {
  if (responderSiHayErroresDeValidacion(req, res)) return;
  try {
    res.json(await areasService.listarAreas());
  } catch (error) {
    next(error);
  }
}

async function obtenerPorId(req, res, next) {
  if (responderSiHayErroresDeValidacion(req, res)) return;
  try {
    const area = await areasService.obtenerAreaPorId(req.params.id);
    res.json(area);
  } catch (error) {
    next(error);
  }
}

async function crear(req, res, next) {
  if (responderSiHayErroresDeValidacion(req, res)) return;
  try {
    res.status(201).json(await areasService.crearArea(req.body.descripcion));
  } catch (error) {
    next(error);
  }
}

async function actualizar(req, res, next) {
  if (responderSiHayErroresDeValidacion(req, res)) return;
  try {
    const area = await areasService.actualizarArea(req.params.id, req.body.descripcion);
    res.json(area);
  } catch (error) {
    next(error);
  }
}

async function eliminar(req, res, next) {
  if (responderSiHayErroresDeValidacion(req, res)) return;
  try {
    await areasService.desactivarArea(req.params.id);
    res.status(204).end();
  } catch (error) {
    next(error);
  }
}

export { listar, obtenerPorId, crear, actualizar, eliminar };
