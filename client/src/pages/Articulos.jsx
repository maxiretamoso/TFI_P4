import { useEffect, useState } from "react";
import { api } from "../api/cliente.js";
import { useAuth } from "../auth/AuthContext.jsx";
import "../styles/categorias.css";
import "./Articulos.css";

// BREAD de artículos: igual que los catálogos simples, pero el formulario
// además apunta a un área y una categoría (selects con sus listados).
function Articulos() {
  const { usuario } = useAuth();
  const puedeEscribir = usuario.rol >= 2;

  const [articulos, setArticulos] = useState([]);
  const [areas, setAreas] = useState([]);
  const [categorias, setCategorias] = useState([]);

  const [idArea, setIdArea] = useState("");
  const [idCategoria, setIdCategoria] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [editandoId, setEditandoId] = useState(null);

  const [busqueda, setBusqueda] = useState("");
  const [error, setError] = useState("");

  async function cargarArticulos() {
    try {
      setArticulos(await api.get("/articulos"));
    } catch (e) {
      setError(e.message);
    }
  }

  // Los dos selects se cargan en paralelo (un solo viaje de ida y vuelta)
  async function cargarCombos() {
    try {
      const [listaAreas, listaCategorias] = await Promise.all([
        api.get("/areas"),
        api.get("/categorias"),
      ]);
      setAreas(listaAreas);
      setCategorias(listaCategorias);
    } catch (e) {
      setError(e.message);
    }
  }

  useEffect(() => {
    cargarArticulos();
    cargarCombos();
  }, []);

  async function guardar(evento) {
    evento.preventDefault();
    setError("");

    const datos = {
      id_area: Number(idArea),
      id_categoria: Number(idCategoria),
      descripcion,
    };

    try {
      if (editandoId) {
        await api.put(`/articulos/${editandoId}`, datos);
      } else {
        await api.post("/articulos", datos);
      }
      limpiar();
      await cargarArticulos();
    } catch (e) {
      setError(e.message);
    }
  }

  async function eliminar(articulo) {
    const seguro = window.confirm(`¿Eliminar "${articulo.descripcion}"?`);
    if (!seguro) return;

    setError("");
    try {
      await api.delete(`/articulos/${articulo.id_articulo}`);
      await cargarArticulos();
    } catch (e) {
      setError(e.message);
    }
  }

  function empezarEdicion(articulo) {
    setEditandoId(articulo.id_articulo);
    setIdArea(String(articulo.id_area));
    setIdCategoria(String(articulo.id_categoria));
    setDescripcion(articulo.descripcion);
  }

  function limpiar() {
    setEditandoId(null);
    setIdArea("");
    setIdCategoria("");
    setDescripcion("");
  }

  const visibles = articulos.filter((articulo) =>
    articulo.descripcion.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="categorias-container">
      <h2>{editandoId ? "Editar artículo" : "Artículos"}</h2>

      {error && <p className="mensaje-error">{error}</p>}

      {puedeEscribir && (
        <form className="form-articulo" onSubmit={guardar}>
          <label>Área:</label>
          <select
            value={idArea}
            onChange={(evento) => setIdArea(evento.target.value)}
            required
          >
            <option value="">Elegir área...</option>
            {areas.map((area) => (
              <option key={area.id_area} value={area.id_area}>
                {area.descripcion}
              </option>
            ))}
          </select>

          <label>Categoría:</label>
          <select
            value={idCategoria}
            onChange={(evento) => setIdCategoria(evento.target.value)}
            required
          >
            <option value="">Elegir categoría...</option>
            {categorias.map((categoria) => (
              <option
                key={categoria.id_categoria}
                value={categoria.id_categoria}
              >
                {categoria.descripcion}
              </option>
            ))}
          </select>

          <label>Artículo:</label>
          <input
            type="text"
            value={descripcion}
            onChange={(evento) => setDescripcion(evento.target.value)}
            placeholder="Nombre del artículo"
            required
            maxLength={150}
          />

          <button type="submit" className="boton-agregar">
            {editandoId ? "Guardar" : "Agregar"}
          </button>
          {editandoId && (
            <button type="button" onClick={limpiar}>
              Cancelar
            </button>
          )}
        </form>
      )}

      <input
        type="text"
        value={busqueda}
        onChange={(evento) => setBusqueda(evento.target.value)}
        placeholder="Buscar artículo..."
      />

      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Artículo</th>
            <th>Área</th>
            <th>Categoría</th>
            {puedeEscribir && <th>Acciones</th>}
          </tr>
        </thead>
        <tbody>
          {visibles.length === 0 && (
            <tr>
              <td colSpan={puedeEscribir ? 5 : 4}>
                No hay artículos cargados.
              </td>
            </tr>
          )}

          {visibles.map((articulo) => (
            <tr key={articulo.id_articulo}>
              <td>{articulo.id_articulo}</td>
              <td>{articulo.descripcion}</td>
              <td>{articulo.area}</td>
              <td>{articulo.categoria}</td>
              {puedeEscribir && (
                <td>
                  <button
                    type="button"
                    className="boton-editar"
                    onClick={() => empezarEdicion(articulo)}
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    className="boton-eliminar"
                    onClick={() => eliminar(articulo)}
                  >
                    Eliminar
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Articulos;
