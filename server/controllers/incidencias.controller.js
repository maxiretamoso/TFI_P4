const incidenciasService = require("../services/incidencias.service");
const historialService = require("../services/incidencias_estados.service");
const { responderSiHayErroresDeValidacion } = require("../utils/validar");

async function listar(req, res, next) {
  if (responderSiHayErroresDeValidacion(req, res)) return;
  try {
    res.json(await incidenciasService.listar(req.usuario, req.query));
  } catch (error) {
    next(error);
  }
}

async function obtenerPorId(req, res, next) {
  try {
    res.json(await incidenciasService.obtenerPorId(req.params.id, req.usuario));
  } catch (error) {
    next(error);
  }
}

async function obtenerHistorial(req, res, next) {
  try {
    await incidenciasService.obtenerPorId(req.params.id, req.usuario);
    res.json(await historialService.listarHistorialDeIncidencia(req.params.id));
  } catch (error) {
    next(error);
  }
}

async function crear(req, res, next) {
  if (responderSiHayErroresDeValidacion(req, res)) return;
  try {
    const incidencia = await incidenciasService.crear(req.body, req.usuario);
    res.status(201).location(`/api/v1/incidencias/${incidencia.id_incidencia}`).json(incidencia);
  } catch (error) {
    next(error);
  }
}

async function asignar(req, res, next) {
  if (responderSiHayErroresDeValidacion(req, res)) return;
  try {
    res.json(await incidenciasService.asignar(req.params.id, req.body.asignado_a));
  } catch (error) {
    next(error);
  }
}

async function finalizar(req, res, next) {
  if (responderSiHayErroresDeValidacion(req, res)) return;
  try {
    res.json(
      await incidenciasService.finalizar(req.params.id, req.body.descripcion_resolucion, req.usuario)
    );
  } catch (error) {
    next(error);
  }
}

async function cancelar(req, res, next) {
  try {
    res.json(await incidenciasService.cancelar(req.params.id, req.usuario));
  } catch (error) {
    next(error);
  }
}

module.exports = { listar, obtenerPorId, obtenerHistorial, crear, asignar, finalizar, cancelar };
