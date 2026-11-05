import * as healthDatos from "../datos/health.datos.js";

function verificarConexion() {
  return healthDatos.verificarConexion();
}

export { verificarConexion };
