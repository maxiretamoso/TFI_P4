import { useEffect, useState } from "react";
import { api } from "../api/cliente.js";
import { useAuth } from "../auth/AuthContext.jsx";
import "./Categorias.css";
import "../categorias/categorias.css";

function Categorias() {
  const { usuario } = useAuth();
  // Rol 1 (agente) solo consulta: alta, edición y baja son de rol 2 y 3
  const puedeEditar = usuario.rol >= 2;

  const [categorias, setCategorias] = useState([]);
  const [descripcion, setDescripcion] = useState("");
  const [editando, setEditando] = useState(null);
  const [busqueda, setBusqueda] = useState("");
  const [resultado, setResultado] = useState("");
  const [error, setError] = useState("");

  async function cargar() {
    try {
      setCategorias(await api.get("/categorias"));
    } catch (e) {
      setError(e.message);
    }
  }

  // Al entrar a la pantalla: se pide la lista (una sola vez)
  useEffect(() => {
    cargar();
  }, []);

  // Un mismo form para agregar y para editar
  async function manejarEnvio(evento) {
    evento.preventDefault();
    setError("");

    try {
      if (editando !== null) {
        await api.put(`/categorias/${editando}`, { descripcion });
        setEditando(null);
      } else {
        await api.post("/categorias", { descripcion });
      }
      setDescripcion("");
      await cargar();
    } catch (e) {
      setError(e.message);
    }
  }

  function editar(categoria) {
    setDescripcion(categoria.descripcion);
    setEditando(categoria.id_categoria);
  }

  function cancelar() {
    setEditando(null);
    setDescripcion("");
  }

  async function eliminar(categoria) {
    const seguro = window.confirm(
      `¿Eliminar la categoría "${categoria.descripcion}"?`
    );
    if (!seguro) return;

    setError("");
    try {
      await api.del(`/categorias/${categoria.id_categoria}`);
      await cargar();
    } catch (e) {
      setError(e.message);
    }
  }

  async function buscar() {
    setResultado("");

    if (busqueda.trim() === "") {
      setResultado("Ingresá un ID para buscar.");
      return;
    }

    try {
      const categoria = await api.get(`/categorias/${busqueda.trim()}`);
      setResultado(`Categoría encontrada: ${categoria.descripcion}`);
    } catch (e) {
      setResultado(e.message);
    }
  }

  return (
    <div className="categorias-container">
      <h2>Categorías</h2>

      {puedeEditar && (
        <form onSubmit={manejarEnvio}>
          <label htmlFor="nombre-categoria">Nombre:</label>
          <input
            type="text"
            id="nombre-categoria"
            placeholder="Ingrese una categoría"
            value={descripcion}
            onChange={(evento) => setDescripcion(evento.target.value)}
            required
            maxLength={100}
          />
          <button type="submit" className="boton-agregar">
            {editando !== null ? "Guardar" : "Agregar"}
          </button>
          {editando !== null && (
            <button type="button" onClick={cancelar}>
              Cancelar
            </button>
          )}
        </form>
      )}

      <div className="buscador-categoria">
        <label htmlFor="id-buscar-categoria">ID de categoría:</label>
        {resultado && <p id="resultado-busqueda">{resultado}</p>}
        <input
          type="number"
          id="id-buscar-categoria"
          min="1"
          value={busqueda}
          onChange={(evento) => setBusqueda(evento.target.value)}
        />
        <button type="button" onClick={buscar}>
          Buscar
        </button>
      </div>

      {error && <p className="mensaje-error">{error}</p>}

      <h2>Listado de categorías</h2>

      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Categoría</th>
            {puedeEditar && <th>Acciones</th>}
          </tr>
        </thead>
        <tbody>
          {categorias.length === 0 && (
            <tr>
              <td colSpan={puedeEditar ? 3 : 2}>No hay categorías para mostrar.</td>
            </tr>
          )}
          {categorias.map((categoria) => (
            <tr key={categoria.id_categoria}>
              <td>{categoria.id_categoria}</td>
              <td>{categoria.descripcion}</td>
              {puedeEditar && (
                <td>
                  <button
                    type="button"
                    className="boton-editar"
                    onClick={() => editar(categoria)}
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    className="boton-eliminar"
                    onClick={() => eliminar(categoria)}
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

export default Categorias;
