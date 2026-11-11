import * as estadosService from "../services/estados.service.js";
import { responderSiHayErroresDeValidacion } from "../utils/validarSolicitud.js";

async function listar(req, res) {
  if (responderSiHayErroresDeValidacion(req, res)) return;
  res.json(await estadosService.listarEstados());
}

async function obtenerPorId(req, res) {
  if (responderSiHayErroresDeValidacion(req, res)) return;
  const estado = await estadosService.obtenerEstadoPorId(req.params.id);
  res.json(estado);
}

export { listar, obtenerPorId };
