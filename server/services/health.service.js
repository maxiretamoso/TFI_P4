const pool = require("../db");

async function verificarConexion() {
  await pool.query("SELECT 1");
}

module.exports = { verificarConexion };
