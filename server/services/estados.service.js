import * as estadosDatos from "../datos/estados.datos.js";
import { crearError } from "../utils/httpError.js";

function listarEstados() {
  return estadosDatos.listar();
}

async function obtenerEstadoPorId(id) {
  const estado = await estadosDatos.buscarPorId(id);
  if (!estado) throw crearError(404, "Estado no encontrado");
  return estado;
}

export { listarEstados, obtenerEstadoPorId };
