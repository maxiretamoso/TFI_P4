function validarEntorno() {
  const requeridas = ["DB_HOST", "DB_USER", "DB_NAME", "JWT_SECRET"];
  const faltantes = requeridas.filter((nombre) => !process.env[nombre]);

  if (faltantes.length) {
    console.error("[entorno] Faltan variables obligatorias: " + faltantes.join(", "));
    console.error("[entorno] Copiá server/.env.example como server/.env y completalo antes de arrancar.");
    process.exit(1);
  }

  if (!process.env.DB_PASSWORD) {
    console.warn("[entorno] DB_PASSWORD vacía: solo sirve si la base acepta conexiones sin contraseña.");
  }

  if (process.env.JWT_SECRET.length < 32) {
    console.error("[entorno] JWT_SECRET necesita al menos 32 caracteres.");
    process.exit(1);
  }

  if (process.env.DB_PASSWORD && process.env.JWT_SECRET === process.env.DB_PASSWORD) {
    console.error("[entorno] JWT_SECRET debe ser distinto de DB_PASSWORD.");
    process.exit(1);
  }
}

module.exports = validarEntorno;
