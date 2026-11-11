import * as categoriasService from "../services/categorias.service.js";
import { responderSiHayErroresDeValidacion } from "../utils/validarSolicitud.js";

async function listar(req, res) {
  if (responderSiHayErroresDeValidacion(req, res)) return;
  res.json(await categoriasService.listarCategorias());
}

async function obtenerPorId(req, res) {
  if (responderSiHayErroresDeValidacion(req, res)) return;
  const categoria = await categoriasService.obtenerCategoriaPorId(req.params.id);
  res.json(categoria);
}

async function crear(req, res) {
  if (responderSiHayErroresDeValidacion(req, res)) return;
  res.status(201).json(await categoriasService.crearCategoria(req.body.descripcion));
}

async function actualizar(req, res) {
  if (responderSiHayErroresDeValidacion(req, res)) return;
  const categoria = await categoriasService.actualizarCategoria(req.params.id, req.body.descripcion);
  res.json(categoria);
}

async function eliminar(req, res) {
  if (responderSiHayErroresDeValidacion(req, res)) return;
  await categoriasService.desactivarCategoria(req.params.id);
  res.status(204).end();
}

export { listar, obtenerPorId, crear, actualizar, eliminar };
