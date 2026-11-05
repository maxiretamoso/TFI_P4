const pool = require("../db");

async function conTransaccion(callback) {
  const cliente = await pool.connect();
  try {
    await cliente.query("BEGIN");
    const resultado = await callback(cliente);
    await cliente.query("COMMIT");
    return resultado;
  } catch (error) {
    await cliente.query("ROLLBACK");
    throw error;
  } finally {
    cliente.release();
  }
}

module.exports = { conTransaccion };
