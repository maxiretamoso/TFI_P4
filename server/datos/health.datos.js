import pool from "../db/index.js";

function verificarConexion() {
  return pool.query("SELECT 1").then(() => true);
}

export { verificarConexion };
