require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const areasRouter = require("./routes/areas");
app.use("/api/areas", areasRouter);

const categoriasRouter = require("./routes/categorias");
app.use("/api/categorias", categoriasRouter);

const estadosRouter = require("./routes/estados");
app.use("/api/estados", estadosRouter);

const articulosRouter = require("./routes/articulos");
app.use("/api/articulos", articulosRouter);

const usuariosRouter = require("./routes/usuarios");
app.use("/api/usuarios", usuariosRouter);

const incidenciasRouter = require("./routes/incidencias");
app.use("/api/incidencias", incidenciasRouter);

const incidenciasEstadosRouter = require("./routes/incidencias_estados");
app.use("/api/incidencias_estados", incidenciasEstadosRouter);

app.get("/", (req, res) => {
  res.send("¡La API de Incidencias está funcionando!");
});

const authRouter = require("./routes/auth");
app.use("/api", authRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
