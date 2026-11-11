import { responderSiHayErroresDeValidacion } from "../utils/validarSolicitud.js";
import * as articulosService from "../services/articulos.service.js";

async function listar(req, res) {
  if (responderSiHayErroresDeValidacion(req, res)) return;
  res.json(await articulosService.listarArticulos(req.usuario));
}

async function obtenerPorId(req, res) {
  if (responderSiHayErroresDeValidacion(req, res)) return;
  res.json(await articulosService.obtenerArticuloPorId(req.params.id, req.usuario));
}

async function crear(req, res) {
  if (responderSiHayErroresDeValidacion(req, res)) return;
  const { id_area, id_categoria, descripcion } = req.body;
  res.status(201).json(await articulosService.crearArticulo({ id_area, id_categoria, descripcion }));
}

async function actualizar(req, res) {
  if (responderSiHayErroresDeValidacion(req, res)) return;
  res.json(
    await articulosService.actualizarArticulo(req.params.id, {
      id_area: req.body.id_area,
      id_categoria: req.body.id_categoria,
      descripcion: req.body.descripcion,
    }),
  );
}

async function eliminar(req, res) {
  if (responderSiHayErroresDeValidacion(req, res)) return;
  await articulosService.desactivarArticulo(req.params.id);
  res.status(204).end();
}

export { listar, obtenerPorId, crear, actualizar, eliminar };
