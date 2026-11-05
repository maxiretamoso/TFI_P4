require("dotenv").config();
require("./utils/validarEntorno")();

const path = require("path");
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const swaggerUi = require("swagger-ui-express");

const { especificacion, PREFIJO_API } = require("./config/swagger");

const app = express();

app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));

// Sin CLIENT_URL se acepta cualquier origen (desarrollo).
const origenesPermitidos = (process.env.CLIENT_URL || "")
  .split(",")
  .map((origen) => origen.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origen, devolver) {
      if (!origen || origenesPermitidos.length === 0) return devolver(null, true);
      if (origenesPermitidos.includes(origen)) return devolver(null, true);
      devolver(new Error(`Origen no permitido por CORS: ${origen}`));
    },
  })
);
app.use(express.json());
app.use(morgan("dev"));

app.use("/publico", express.static(path.join(__dirname, "publico")));

const limitadorDeLogin = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: { error: "Demasiados intentos de inicio de sesión. Esperá unos minutos." },
});
app.use(`${PREFIJO_API}/auth/login`, limitadorDeLogin);

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(especificacion));
app.get("/api-docs.json", (req, res) => res.json(especificacion));

app.use(`${PREFIJO_API}/auth`, require("./routes/auth"));
app.use(`${PREFIJO_API}/health`, require("./routes/health"));
app.use(`${PREFIJO_API}/me`, require("./routes/me"));
app.use(`${PREFIJO_API}/areas`, require("./routes/areas"));
app.use(`${PREFIJO_API}/categorias`, require("./routes/categorias"));
app.use(`${PREFIJO_API}/estados`, require("./routes/estados"));
app.use(`${PREFIJO_API}/articulos`, require("./routes/articulos"));
app.use(`${PREFIJO_API}/usuarios`, require("./routes/usuarios"));
app.use(`${PREFIJO_API}/incidencias`, require("./routes/incidencias"));
app.use(`${PREFIJO_API}/incidencias-estados`, require("./routes/incidencias_estados"));
app.use(`${PREFIJO_API}/dashboard`, require("./routes/dashboard"));
app.use(`${PREFIJO_API}/reportes`, require("./routes/reportes"));

app.get("/", (req, res) => {
  res.json({ api: "Gestión de Incidencias", version: "v1", documentacion: "/api-docs" });
});

app.use((req, res) => {
  res.status(404).json({ error: "Ruta no encontrada", ruta: req.originalUrl });
});

app.use((err, req, res, next) => {
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({ error: "El archivo supera el tamaño máximo de 2 MB" });
  }
  // 23503: violación de clave foránea en PostgreSQL
  if (err.code === "23503") {
    return res.status(400).json({ error: "Alguno de los ids enviados no existe en la base" });
  }

  const status = err.status || 500;
  if (status >= 500) console.error(err);

  res.status(status).json({
    error: status >= 500 ? "Error interno del servidor" : err.message,
  });
});

const PUERTO = process.env.PORT || 3000;
if (require.main === module) {
  app.listen(PUERTO, () => {
    console.log(`API escuchando en http://localhost:${PUERTO}${PREFIJO_API}`);
    console.log(`Documentación en http://localhost:${PUERTO}/api-docs`);
  });
}

module.exports = app;
