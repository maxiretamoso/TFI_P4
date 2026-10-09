const pool = require("../db");

/**
 * Ejecuta un bloque de escritura como UNA transacción.
 *
 * Todas las consultas del callback van por el MISMO cliente físico del pool:
 * o se confirman todas (COMMIT) o se deshacen todas (ROLLBACK).
 *
 * ¿Por qué pool.connect() y no pool.query()?
 *   pool.query() toma una conexión LIBRE distinta en cada llamada, y la segunda
 *   consulta no vería los cambios no confirmados de la primera. connect() toma
 *   una conexión exclusiva para todo el bloque.
 *
 * Uso:
 *   return conTransaccion(async (client) => {
 *     const r = await client.query(`INSERT INTO incidencias ... RETURNING *`, [...]);
 *     await client.query(`INSERT INTO incidencias_estados ... VALUES (...)`, [...]);
 *     return r.rows[0];
 *   });
 */
async function conTransaccion(callback) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const resultado = await callback(client);
    await client.query("COMMIT");
    return resultado;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release(); // SIEMPRE se devuelve el cliente al pool
  }
}

module.exports = { conTransaccion };
