import { useEffect, useState } from "react";
import { api } from "../api/cliente.js";
import { useAuth } from "../auth/AuthContext.jsx";
import "../styles/categorias.css";
import "./Catalogo.css";
import Cargando from "../components/Cargando.jsx";

// BREAD genérico para catálogos de texto simple (áreas, categorías, estados).
// La lógica se escribe UNA vez; cada catálogo la usa con su configuración.
function Catalogo({
  titulo,
  ruta,
  campoId,
  placeholderBuscar = "Buscar...",
  maxLength = 100,
}) {
  const { usuario } = useAuth();
  const puedeEscribir = usuario.rol >= 2;

  const [items, setItems] = useState([]);
  const [descripcion, setDescripcion] = useState("");
  const [editandoId, setEditandoId] = useState(null);
  const [busqueda, setBusqueda] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(true);

  async function cargar() {
    try {
      setItems(await api.get(ruta));
    } catch (e) {
      setError(e.message);
    }
  }

  useEffect(() => {
    cargar().finally(() => setCargando(false));
  }, []);

  if (cargando) return <Cargando texto={`Cargando ${titulo.toLowerCase()}...`} />;

  async function guardar(evento) {
    evento.preventDefault();
    setError("");
    try {
      if (editandoId) {
        await api.put(`${ruta}/${editandoId}`, { descripcion });
      } else {
        await api.post(ruta, { descripcion });
      }
      cancelarEdicion();
      await cargar();
    } catch (e) {
      setError(e.message);
    }
  }

  async function eliminar(item) {
    const seguro = window.confirm(`¿Eliminar "${item.descripcion}"?`);
    if (!seguro) return;

    setError("");
    try {
      await api.delete(`${ruta}/${item[campoId]}`);
      await cargar();
    } catch (e) {
      setError(e.message);
    }
  }

  function empezarEdicion(item) {
    setEditandoId(item[campoId]);
    setDescripcion(item.descripcion);
  }

  function cancelarEdicion() {
    setEditandoId(null);
    setDescripcion("");
  }

  const visibles = items.filter((item) =>
    item.descripcion.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="categorias-container">
      <h2>{editandoId ? `Editar ${titulo.toLowerCase()}` : titulo}</h2>

      {error && <p className="mensaje-error">{error}</p>}

      {puedeEscribir && (
        <form onSubmit={guardar}>
          <input
            type="text"
            value={descripcion}
            onChange={(evento) => setDescripcion(evento.target.value)}
            placeholder={titulo}
            required
            maxLength={maxLength}
          />
          <button type="submit" className="boton-agregar">
            {editandoId ? "Guardar" : "Agregar"}
          </button>
          {editandoId && (
            <button type="button" onClick={cancelarEdicion}>
              Cancelar
            </button>
          )}
        </form>
      )}

      <input
        type="text"
        value={busqueda}
        onChange={(evento) => setBusqueda(evento.target.value)}
        placeholder={placeholderBuscar}
      />

      <div className="tabla-scroll">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Descripción</th>
              {puedeEscribir && <th>Acciones</th>}
            </tr>
          </thead>
        <tbody>
          {visibles.length === 0 && (
            <tr>
              <td colSpan={puedeEscribir ? 3 : 2}>No hay registros.</td>
            </tr>
          )}

          {visibles.map((item) => (
            <tr key={item[campoId]}>
              <td>{item[campoId]}</td>
              <td>{item.descripcion}</td>
              {puedeEscribir && (
                <td>
                  <button
                    type="button"
                    className="boton-editar"
                    onClick={() => empezarEdicion(item)}
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    className="boton-eliminar"
                    onClick={() => eliminar(item)}
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
    </div>
  );
}

export default Catalogo;
