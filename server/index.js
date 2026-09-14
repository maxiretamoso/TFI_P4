require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const path = require("path");

const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Swagger
const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: "3.0.0",
    info: { title: "API Incidencias TFI P4", version: "1.0.0", description: "API REST - Trabajo Final Integrador Programación IV" },
    components: {
      securitySchemes: { bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" } }
    }
  },
  apis: ["./routes/*.js"],
});
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get("/api-docs.json", (req, res) => res.json(swaggerSpec));

// Routers
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

// Versionado /api/v1 + compatibilidad /api
function mountVersioned(prefix, router) {
  app.use(`/api/v1${prefix}`, router);
  app.use(`/api${prefix}`, router); // compat legacy
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

// auth tiene rutas /login y /register -> montado como /api/v1/auth y /api/auth
app.use("/api/v1/auth", authRouter);
app.use("/api", authRouter);

app.use("/api/v1/health", healthRouter);
app.use("/api/health", healthRouter);
app.use("/api/v1/me", meRouter);
app.use("/api/me", meRouter);

app.get("/", (req, res) => {
  res.json({ mensaje: "¡La API de Incidencias está funcionando!", version: "v1", docs: "/api-docs" });
});

// 404 genérico
app.use((req, res) => {
  res.status(404).json({ error: "Ruta no encontrada", path: req.originalUrl });
});

// Manejo centralizado de errores
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, _next) => {
  console.error("Error no manejado:", err);
  const status = err.status || 500;
  res.status(status).json({ error: err.message || "Error interno del servidor" });
});

const PORT = process.env.PORT || 3000;
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT} - docs en /api-docs`);
  });
}
module.exports = app;
