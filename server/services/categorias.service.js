import * as categoriasDatos from "../datos/categorias.datos.js";
import { crearError } from "../utils/httpError.js";

function listarCategorias() {
  return categoriasDatos.listar();
}

async function obtenerCategoriaPorId(id) {
  const categoria = await categoriasDatos.buscarPorId(id);
  if (!categoria) throw crearError(404, "Categoría no encontrada");
  return categoria;
}

function crearCategoria(descripcion) {
  return categoriasDatos.insertar(descripcion);
}

async function actualizarCategoria(id, descripcion) {
  const categoria = await categoriasDatos.actualizar(id, descripcion);
  if (!categoria) throw crearError(404, "Categoría no encontrada");
  return categoria;
}

async function desactivarCategoria(id) {
  const categoria = await categoriasDatos.desactivar(id);
  if (!categoria) throw crearError(404, "Categoría no encontrada");
  return categoria;
}

export {
  listarCategorias,
  obtenerCategoriaPorId,
  crearCategoria,
  actualizarCategoria,
  desactivarCategoria,
};
