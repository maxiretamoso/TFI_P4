import { useEffect, useState } from "react";
import { api } from "../api/cliente.js";
import { useAuth } from "../auth/AuthContext.jsx";
import "../styles/categorias.css";
import "./Usuarios.css";
import Cargando from "../components/Cargando.jsx";

// Etiquetas de los roles según el enunciado (la API guarda números)
const ROLES = {
  1: "Municipal",
  2: "Sistemas",
  3: "Director",
};

// Nómina de usuarios: BREAD completo para el director, lectura para el resto.
// (El backend igual decide: el service solo permite editar tu propio perfil
// a los que no son director, y nadie cambia rol/área salvo el director.)
function Usuarios() {
  const { usuario } = useAuth();
  const esDirector = usuario.rol === 3;

  const [usuarios, setUsuarios] = useState([]);
  const [areas, setAreas] = useState([]);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(true);

  // Formulario de alta y edición (la contraseña solo va en alta)
  const [nombres, setNombres] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [nombreUsuario, setNombreUsuario] = useState("");
  const [contrasenia, setContrasenia] = useState("");
  const [idArea, setIdArea] = useState("");
  const [rol, setRol] = useState("1");
  const [editandoId, setEditandoId] = useState(null);

  const [busqueda, setBusqueda] = useState("");

  async function cargar() {
    try {
      setUsuarios(await api.get("/usuarios"));
    } catch (e) {
      setError(e.message);
    }
  }

  async function cargarAreas() {
    try {
      setAreas(await api.get("/areas"));
    } catch (e) {
      setError(e.message);
    }
  }

  useEffect(() => {
    Promise.all([cargar(), cargarAreas()]).finally(() => setCargando(false));
  }, []);

  if (cargando) return <Cargando texto="Cargando usuarios..." />;

  async function guardar(evento) {
    evento.preventDefault();
    setError("");

    const datos = {
      nombres,
      apellidos,
      usuario: nombreUsuario,
      id_area: Number(idArea),
      rol: Number(rol),
    };

    try {
      if (editandoId) {
        // El PUT no lleva contraseña: no se cambia desde acá
        await api.put(`/usuarios/${editandoId}`, datos);
      } else {
        await api.post("/usuarios", { ...datos, contrasenia });
      }
      limpiar();
      await cargar();
    } catch (e) {
      setError(e.message);
    }
  }

  async function empezarEdicion(item) {
    setError("");
    try {
      // El listado no trae id_area (trae el nombre): pedimos el detalle
      // (la operación Read del BREAD) para prellenar el select de área
      const detalle = await api.get(`/usuarios/${item.id_usuario}`);
      setEditandoId(detalle.id_usuario);
      setNombres(detalle.nombres);
      setApellidos(detalle.apellidos);
      setNombreUsuario(detalle.usuario);
      setIdArea(String(detalle.id_area));
      setRol(String(detalle.rol));
    } catch (e) {
      setError(e.message);
    }
  }

  async function eliminar(item) {
    const seguro = window.confirm(
      `¿Eliminar a ${item.nombres} ${item.apellidos}?`
    );
    if (!seguro) return;

    setError("");
    try {
      await api.del(`/usuarios/${item.id_usuario}`);
      await cargar();
    } catch (e) {
      setError(e.message);
    }
  }

  function limpiar() {
    setEditandoId(null);
    setNombres("");
    setApellidos("");
    setNombreUsuario("");
    setContrasenia("");
    setIdArea("");
    setRol("1");
  }

  const visibles = usuarios.filter((item) => {
    const texto = `${item.nombres} ${item.apellidos} ${item.usuario} ${item.area}`.toLowerCase();
    return texto.includes(busqueda.toLowerCase());
  });

  return (
    <div className="categorias-container">
      <h2>Usuarios</h2>

      {error && <p className="mensaje-error">{error}</p>}

      {esDirector && (
        <form className="form-usuario" onSubmit={guardar}>
          <label>Nombres:</label>
          <input
            type="text"
            value={nombres}
            onChange={(evento) => setNombres(evento.target.value)}
            required
            maxLength={100}
          />

          <label>Apellidos:</label>
          <input
            type="text"
            value={apellidos}
            onChange={(evento) => setApellidos(evento.target.value)}
            required
            maxLength={100}
          />

          <label>Usuario:</label>
          <input
            type="text"
            value={nombreUsuario}
            onChange={(evento) => setNombreUsuario(evento.target.value)}
            required
            maxLength={100}
          />

          {!editandoId && (
            <>
              <label>Contraseña:</label>
              <input
                type="password"
                value={contrasenia}
                onChange={(evento) => setContrasenia(evento.target.value)}
                required
                minLength={6}
                maxLength={100}
              />
            </>
          )}

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

          <label>Rol:</label>
          <select
            value={rol}
            onChange={(evento) => setRol(evento.target.value)}
          >
            {Object.entries(ROLES).map(([valor, etiqueta]) => (
              <option key={valor} value={valor}>
                {etiqueta}
              </option>
            ))}
          </select>

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
        placeholder="Buscar usuario..."
      />

      <div className="tabla-scroll">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Nombre</th>
              <th>Usuario</th>
              <th>Área</th>
              <th>Rol</th>
              {esDirector && <th>Acciones</th>}
            </tr>
          </thead>
        <tbody>
          {visibles.length === 0 && (
            <tr>
              <td colSpan={esDirector ? 6 : 5}>No hay usuarios.</td>
            </tr>
          )}

          {visibles.map((item) => (
            <tr key={item.id_usuario}>
              <td>{item.id_usuario}</td>
              <td>
                {item.nombres} {item.apellidos}
              </td>
              <td>{item.usuario}</td>
              <td>{item.area}</td>
              <td>{ROLES[item.rol] ?? item.rol}</td>
              {esDirector && (
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

export default Usuarios;
