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
  const area = await areasDatos.buscarPorId(id);
  if (!area) throw crearError(404, "Área no encontrada");

  const { usuarios, articulos } = await areasDatos.contarEnUso(id);
  if (usuarios > 0 || articulos > 0) {
    const enUso = [
      usuarios && `${usuarios} usuario${usuarios === 1 ? "" : "s"}`,
      articulos && `${articulos} artículo${articulos === 1 ? "" : "s"}`,
    ].filter(Boolean);
    throw crearError(409, `No se puede dar de baja: el área tiene ${enUso.join(" y ")}.`);
  }

  return areasDatos.desactivar(id);
}

export { listarAreas, obtenerAreaPorId, crearArea, actualizarArea, desactivarArea };
