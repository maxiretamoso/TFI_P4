const pool = require("../db");

function verificarConexion() {
  return pool.query("SELECT 1").then(() => true);
}

module.exports = { verificarConexion };
