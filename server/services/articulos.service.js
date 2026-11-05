import * as articulosDatos from "../datos/articulos.datos.js";
import * as areasDatos from "../datos/areas.datos.js";
import * as categoriasDatos from "../datos/categorias.datos.js";
import { crearError } from "../utils/httpError.js";

async function validarReferencias(id_area, id_categoria) {
  const [area, categoria] = await Promise.all([
    areasDatos.buscarPorId(id_area),
    categoriasDatos.buscarPorId(id_categoria),
  ]);
  if (!area) throw crearError(400, "El área indicada no existe");
  if (!categoria) throw crearError(400, "La categoría indicada no existe");
}

function listarArticulos() {
  return articulosDatos.listar();
}

async function obtenerArticuloPorId(id) {
  const articulo = await articulosDatos.buscarPorId(id);
  if (!articulo) throw crearError(404, "Artículo no encontrado");
  return articulo;
}

async function crearArticulo({ id_area, id_categoria, descripcion }) {
  await validarReferencias(id_area, id_categoria);
  return articulosDatos.insertar({ id_area, id_categoria, descripcion });
}

async function actualizarArticulo(id, datos) {
  const actual = await articulosDatos.buscarPorId(id);
  if (!actual) throw crearError(404, "Artículo no encontrado");

  const id_area = datos.id_area ?? actual.id_area;
  const id_categoria = datos.id_categoria ?? actual.id_categoria;
  const descripcion = datos.descripcion ?? actual.descripcion;

  await validarReferencias(id_area, id_categoria);
  return articulosDatos.actualizar(id, { id_area, id_categoria, descripcion });
}

async function desactivarArticulo(id) {
  const articulo = await articulosDatos.desactivar(id);
  if (!articulo) throw crearError(404, "Artículo no encontrado");
  return articulo;
}

export {
  listarArticulos,
  obtenerArticuloPorId,
  crearArticulo,
  actualizarArticulo,
  desactivarArticulo,
};
