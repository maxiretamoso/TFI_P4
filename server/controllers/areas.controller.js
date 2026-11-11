import * as areasService from "../services/areas.service.js";
import { responderSiHayErroresDeValidacion } from "../utils/validarSolicitud.js";

async function listar(req, res) {
  if (responderSiHayErroresDeValidacion(req, res)) return;
  res.json(await areasService.listarAreas());
}

async function obtenerPorId(req, res) {
  if (responderSiHayErroresDeValidacion(req, res)) return;
  const area = await areasService.obtenerAreaPorId(req.params.id);
  res.json(area);
}

async function crear(req, res) {
  if (responderSiHayErroresDeValidacion(req, res)) return;
  res.status(201).json(await areasService.crearArea(req.body.descripcion));
}

async function actualizar(req, res) {
  if (responderSiHayErroresDeValidacion(req, res)) return;
  const area = await areasService.actualizarArea(req.params.id, req.body.descripcion);
  res.json(area);
}

async function eliminar(req, res) {
  if (responderSiHayErroresDeValidacion(req, res)) return;
  await areasService.desactivarArea(req.params.id);
  res.status(204).end();
}

export { listar, obtenerPorId, crear, actualizar, eliminar };
