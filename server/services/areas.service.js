import * as areasDatos from "../datos/areas.datos.js";
import { crearError } from "../utils/httpError.js";

function listarAreas() {
  return areasDatos.listar();
}

async function obtenerAreaPorId(id) {
  const area = await areasDatos.buscarPorId(id);
  if (!area) throw crearError(404, "Área no encontrada");
  return area;
}

function crearArea(descripcion) {
  return areasDatos.insertar(descripcion);
}

async function actualizarArea(id, descripcion) {
  const area = await areasDatos.actualizar(id, descripcion);
  if (!area) throw crearError(404, "Área no encontrada");
  return area;
}

async function desactivarArea(id) {
  const area = await areasDatos.desactivar(id);
  if (!area) throw crearError(404, "Área no encontrada");
  return area;
}

export { listarAreas, obtenerAreaPorId, crearArea, actualizarArea, desactivarArea };
