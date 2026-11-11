import { PREFIJO_API } from "../../shared/constantes.js";
import * as incidenciasService from "../services/incidencias.service.js";
import * as historialService from "../services/incidencias_estados.service.js";
import { responderSiHayErroresDeValidacion } from "../utils/validarSolicitud.js";

async function listar(req, res) {
  if (responderSiHayErroresDeValidacion(req, res)) return;
  res.json(await incidenciasService.listar(req.usuario, req.query));
}

async function obtenerPorId(req, res) {
  if (responderSiHayErroresDeValidacion(req, res)) return;
  res.json(await incidenciasService.obtenerPorId(req.params.id, req.usuario));
}

async function obtenerHistorial(req, res) {
  if (responderSiHayErroresDeValidacion(req, res)) return;
  await incidenciasService.obtenerPorId(req.params.id, req.usuario);
  res.json(await historialService.listarHistorialDeIncidencia(req.params.id));
}

async function crear(req, res) {
  if (responderSiHayErroresDeValidacion(req, res)) return;
  const incidencia = await incidenciasService.crear(req.body, req.usuario);
  res.status(201).location(`${PREFIJO_API}/incidencias/${incidencia.id_incidencia}`).json(incidencia);
}

async function asignar(req, res) {
  if (responderSiHayErroresDeValidacion(req, res)) return;
  res.json(await incidenciasService.asignar(req.params.id, req.body.asignado_a));
}

async function finalizar(req, res) {
  if (responderSiHayErroresDeValidacion(req, res)) return;
  res.json(
    await incidenciasService.finalizar(req.params.id, req.body.descripcion_resolucion, req.usuario)
  );
}

async function cancelar(req, res) {
  if (responderSiHayErroresDeValidacion(req, res)) return;
  res.json(await incidenciasService.cancelar(req.params.id, req.usuario));
}

export { listar, obtenerPorId, obtenerHistorial, crear, asignar, finalizar, cancelar };
