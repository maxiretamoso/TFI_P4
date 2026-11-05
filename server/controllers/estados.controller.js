import * as estadosService from "../services/estados.service.js";
import { responderSiHayErroresDeValidacion } from "../utils/validar.js";

async function listar(req, res, next) {
  if (responderSiHayErroresDeValidacion(req, res)) return;
  try {
    res.json(await estadosService.listarEstados());
  } catch (error) {
    next(error);
  }
}

async function obtenerPorId(req, res, next) {
  if (responderSiHayErroresDeValidacion(req, res)) return;
  try {
    const estado = await estadosService.obtenerEstadoPorId(req.params.id);
    res.json(estado);
  } catch (error) {
    next(error);
  }
}

export { listar, obtenerPorId };
