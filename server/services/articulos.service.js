import * as articulosDatos from "../datos/articulos.datos.js";
import * as areasDatos from "../datos/areas.datos.js";
import * as categoriasDatos from "../datos/categorias.datos.js";
import * as incidenciasDatos from "../datos/incidencias.datos.js";
import { crearError } from "../utils/httpError.js";
import { ROLES, SIN_RESOLVER } from "../../shared/constantes.js";

async function validarReferencias(id_area, id_categoria) {
  const [area, categoria] = await Promise.all([
    areasDatos.buscarPorId(id_area),
    categoriasDatos.buscarPorId(id_categoria),
  ]);
  if (!area || area.activo !== 1) throw crearError(400, "El área indicada no existe");
  if (!categoria || categoria.activo !== 1) throw crearError(400, "La categoría indicada no existe");
}

// El Municipal solo ve los artículos de su área; Sistemas y el Director, todos.
function listarArticulos(solicitante) {
  const soloSuArea = solicitante.rol === ROLES.EMPLEADO_MUNICIPAL ? solicitante.id_area : null;
  return articulosDatos.listar(soloSuArea);
}

async function obtenerArticuloPorId(id, solicitante) {
  const articulo = await articulosDatos.buscarPorId(id);
  if (!articulo) throw crearError(404, "Artículo no encontrado");
  if (solicitante.rol === ROLES.EMPLEADO_MUNICIPAL && articulo.id_area !== solicitante.id_area) {
    throw crearError(403, "Solo podés consultar artículos de tu área");
  }
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
  const articulo = await articulosDatos.buscarPorId(id);
  if (!articulo) throw crearError(404, "Artículo no encontrado");

  const sinResolver = await incidenciasDatos.contarDelArticuloEnEstados(id, SIN_RESOLVER);
  if (sinResolver > 0) {
    throw crearError(
      409,
      `No se puede dar de baja: el artículo tiene ${sinResolver} incidencia${sinResolver === 1 ? "" : "s"} sin resolver.`
    );
  }

  return articulosDatos.desactivar(id);
}

export {
  listarArticulos,
  obtenerArticuloPorId,
  crearArticulo,
  actualizarArticulo,
  desactivarArticulo,
};
