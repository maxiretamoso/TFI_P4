import * as incidenciasEstadosDatos from "../datos/incidencias_estados.datos.js";

function listarHistorial() {
  return incidenciasEstadosDatos.listar();
}

function listarHistorialDeIncidencia(idIncidencia) {
  return incidenciasEstadosDatos.listarPorIncidencia(idIncidencia);
}

export { listarHistorial, listarHistorialDeIncidencia };
