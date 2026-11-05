import "dotenv/config";

import path from "path";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import swaggerUi from "swagger-ui-express";

import { especificacion, PREFIJO_API } from "./config/swagger.js";
import validarEntorno from "./utils/validarEntorno.js";
import rutasAuth from "./routes/auth.js";
import rutasHealth from "./routes/health.js";
import rutasMe from "./routes/me.js";
import rutasAreas from "./routes/areas.js";
import rutasCategorias from "./routes/categorias.js";
import rutasEstados from "./routes/estados.js";
import rutasArticulos from "./routes/articulos.js";
import rutasUsuarios from "./routes/usuarios.js";
import rutasAvatares from "./routes/avatares.js";
import rutasIncidencias from "./routes/incidencias.js";
import rutasIncidenciasEstados from "./routes/incidencias_estados.js";
import rutasDashboard from "./routes/dashboard.js";
import rutasReportes from "./routes/reportes.js";

validarEntorno();

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
      devolver(Object.assign(new Error("Origen no permitido"), { status: 403 }));
    },
  })
);
app.use(express.json());
app.use(morgan("dev"));

app.use("/publico", express.static(path.join(import.meta.dirname, "publico")));

const limitadorDeLogin = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: { error: "Demasiados intentos fallidos. Probá de nuevo en 15 minutos." },
});
app.use(`${PREFIJO_API}/auth/login`, limitadorDeLogin);

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(especificacion));
app.get("/api-docs.json", (req, res) => res.json(especificacion));

app.use(`${PREFIJO_API}/auth`, rutasAuth);
app.use(`${PREFIJO_API}/health`, rutasHealth);
app.use(`${PREFIJO_API}/me`, rutasMe);
app.use(`${PREFIJO_API}/areas`, rutasAreas);
app.use(`${PREFIJO_API}/categorias`, rutasCategorias);
app.use(`${PREFIJO_API}/estados`, rutasEstados);
app.use(`${PREFIJO_API}/articulos`, rutasArticulos);
app.use(`${PREFIJO_API}/usuarios`, rutasUsuarios);
app.use(`${PREFIJO_API}/avatares`, rutasAvatares);
app.use(`${PREFIJO_API}/incidencias`, rutasIncidencias);
app.use(`${PREFIJO_API}/incidencias-estados`, rutasIncidenciasEstados);
app.use(`${PREFIJO_API}/dashboard`, rutasDashboard);
app.use(`${PREFIJO_API}/reportes`, rutasReportes);

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
app.listen(PUERTO, () => {
  console.log(`API escuchando en http://localhost:${PUERTO}${PREFIJO_API}`);
  console.log(`Documentación en http://localhost:${PUERTO}/api-docs`);
});
