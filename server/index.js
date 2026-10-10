require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const path = require("path");

const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const app = express();
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(cors({ origin: process.env.CLIENT_URL }));
app.use(express.json());
app.use(morgan("dev"));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: {
    error: "Demasiados intentos de inicio de sesión. Esperá unos minutos y volvé a intentar.",
  },
});

app.use("/api/v1/auth/login", loginLimiter);
app.use("/api/login", loginLimiter);

const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: "3.0.0",
    info: {
      title: "API Incidencias TFI P4",
      version: "1.0.0",
      description: "API REST - Trabajo Final Integrador Programación IV",
    },
    components: {
      securitySchemes: {
        bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
      },
    },
  },
  apis: ["./routes/*.js"],
});
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get("/api-docs.json", (req, res) => res.json(swaggerSpec));

const areasRouter = require("./routes/areas");
const categoriasRouter = require("./routes/categorias");
const estadosRouter = require("./routes/estados");
const articulosRouter = require("./routes/articulos");
const usuariosRouter = require("./routes/usuarios");
const incidenciasRouter = require("./routes/incidencias");
const incidenciasEstadosRouter = require("./routes/incidencias_estados");
const authRouter = require("./routes/auth");
const healthRouter = require("./routes/health");
const meRouter = require("./routes/me");
const dashboardRouter = require("./routes/dashboard");
const reportesRouter = require("./routes/reportes");

function mountVersioned(prefix, router) {
  app.use(`/api/v1${prefix}`, router);
  app.use(`/api${prefix}`, router);
}
mountVersioned("/areas", areasRouter);
mountVersioned("/categorias", categoriasRouter);
mountVersioned("/estados", estadosRouter);
mountVersioned("/articulos", articulosRouter);
mountVersioned("/usuarios", usuariosRouter);
mountVersioned("/incidencias", incidenciasRouter);
mountVersioned("/incidencias_estados", incidenciasEstadosRouter);
mountVersioned("/dashboard", dashboardRouter);
mountVersioned("/reportes", reportesRouter);

app.use("/api/v1/auth", authRouter);
app.use("/api", authRouter);

app.use("/api/v1/health", healthRouter);
app.use("/api/health", healthRouter);
app.use("/api/v1/me", meRouter);
app.use("/api/me", meRouter);

app.get("/", (req, res) => {
  res.json({
    mensaje: "¡La API de Incidencias está funcionando!",
    version: "v1",
    docs: "/api-docs",
  });
});

app.use((req, res) => {
  res.status(404).json({ error: "Ruta no encontrada", path: req.originalUrl });
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, _next) => {
  console.error("Error no manejado:", err);
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({
      error: "El archivo supera el tamaño máximo permitido (2 MB)",
    });
  }
  // Violación de foreign key en Postgres (código 23503): el pedido traía un id que
  // no existe en la tabla referenciada. Se traduce a 400 con mensaje claro,
  // en vez de un 500 genérico que parecería un crash del servidor.
  if (err.code === "23503") {
    return res
      .status(400)
      .json({
        error:
          "Referencia inexistente: uno de los ids enviados no existe en la base",
      });
  }
  const status = err.status || 500;
  res
    .status(status)
    .json({ error: err.message || "Error interno del servidor" });
});

const PORT = process.env.PORT || 3000;
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(
      `Servidor corriendo en http://localhost:${PORT} - docs en /api-docs`,
    );
  });
}
module.exports = app;
