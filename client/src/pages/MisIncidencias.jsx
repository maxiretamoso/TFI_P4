import { Fragment, useEffect, useState } from "react";
import { api } from "../api/cliente.js";
import { useAuth } from "../auth/AuthContext.jsx";
import { PRIORIDADES } from "./prioridades.js";
import "../categorias/categorias.css";
import "./incidencias.css";
import "./MisIncidencias.css";

function MisIncidencias() {
  const { usuario } = useAuth();

  const [incidencias, setIncidencias] = useState([]);
  const [articulos, setArticulos] = useState([]);
  const [usuariosSistemas, setUsuariosSistemas] = useState([]);
  const [error, setError] = useState("");

  // Formulario de alta
  const [idArticulo, setIdArticulo] = useState("");
  const [prioridad, setPrioridad] = useState("1");
  const [pedido, setPedido] = useState("");

  // Acciones abiertas en la tabla (null = ninguna)
  const [finalizandoId, setFinalizandoId] = useState(null);
  const [resolucion, setResolucion] = useState("");
  const [asignandoId, setAsignandoId] = useState(null);
  const [idDestino, setIdDestino] = useState("");

  async function cargar() {
    try {
      setIncidencias(await api.get("/incidencias/mias"));
    } catch (e) {
      setError(e.message);
    }
  }

  async function cargarArticulos() {
    try {
      setArticulos(await api.get("/articulos"));
    } catch (e) {
      setError(e.message);
    }
  }

  useEffect(() => {
    cargar();
    cargarArticulos();
  }, []);

  async function crear(evento) {
    evento.preventDefault();
    setError("");
    try {
      await api.post("/incidencias", {
        id_articulo: Number(idArticulo),
        prioridad: Number(prioridad),
        descripcion_pedido: pedido,
      });
      setPedido("");
      setIdArticulo("");
      setPrioridad("1");
      await cargar();
    } catch (e) {
      setError(e.message);
    }
  }

  async function cancelar(inc) {
    const seguro = window.confirm(
      `¿Cancelar la incidencia #${inc.id_incidencia}?`
    );
    if (!seguro) return;

    setError("");
    try {
      await api.patch(`/incidencias/${inc.id_incidencia}/cancelar`);
      await cargar();
    } catch (e) {
      setError(e.message);
    }
  }

  async function finalizar(inc) {
    if (!resolucion.trim()) {
      setError("Contá cómo se resolvió.");
      return;
    }

    setError("");
    try {
      await api.patch(`/incidencias/${inc.id_incidencia}/finalizar`, {
        descripcion_resolucion: resolucion,
      });
      setFinalizandoId(null);
      setResolucion("");
      await cargar();
    } catch (e) {
      setError(e.message);
    }
  }

  // Los usuarios de Sistemas se piden recién al primer clic (no antes)
  async function abrirAsignar(inc) {
    setError("");
    setAsignandoId(inc.id_incidencia);
    setIdDestino("");

    if (usuariosSistemas.length === 0) {
      try {
        const todos = await api.get("/usuarios");
        setUsuariosSistemas(todos.filter((u) => u.rol === 2));
      } catch (e) {
        setError(e.message);
      }
    }
  }

  async function asignar(inc) {
    if (!idDestino) {
      setError("Elegí un empleado de Sistemas.");
      return;
    }

    setError("");
    try {
      await api.patch(`/incidencias/${inc.id_incidencia}/asignar`, {
        asignado_a: Number(idDestino),
      });
      setAsignandoId(null);
      await cargar();
    } catch (e) {
      setError(e.message);
    }
  }

  // Reglas del service, pintadas acá (el backend las vuelve a validar)
  function puedeCancelar(inc) {
    return inc.id_estado === 1 && usuario.rol !== 2;
  }

  function puedeFinalizar(inc) {
    return (
      inc.id_estado !== 3 &&
      inc.id_estado !== 4 &&
      (usuario.rol === 3 ||
        (usuario.rol === 2 && inc.asignado_a === usuario.id_usuario))
    );
  }

  function puedeAsignar(inc) {
    return inc.id_estado !== 3 && inc.id_estado !== 4 && usuario.rol === 3;
  }

  function fecha(iso) {
    return new Date(iso).toLocaleString("es-AR", {
      dateStyle: "short",
      timeStyle: "short",
    });
  }

  return (
    <div className="tarjeta-lista">
      <h2>Nueva incidencia</h2>

      <form className="form-alta" onSubmit={crear}>
        <label htmlFor="articulo">Artículo:</label>
        <select
          id="articulo"
          value={idArticulo}
          onChange={(evento) => setIdArticulo(evento.target.value)}
          required
        >
          <option value="">Elegir artículo...</option>
          {articulos.map((articulo) => (
            <option key={articulo.id_articulo} value={articulo.id_articulo}>
              {articulo.descripcion}
            </option>
          ))}
        </select>

        <label htmlFor="prioridad">Prioridad:</label>
        <select
          id="prioridad"
          value={prioridad}
          onChange={(evento) => setPrioridad(evento.target.value)}
        >
          {Object.entries(PRIORIDADES).map(([valor, etiqueta]) => (
            <option key={valor} value={valor}>
              {etiqueta}
            </option>
          ))}
        </select>

        <label htmlFor="pedido">Pedido:</label>
        <input
          type="text"
          id="pedido"
          value={pedido}
          onChange={(evento) => setPedido(evento.target.value)}
          placeholder="Describí el problema"
          required
          maxLength={255}
        />

        <button type="submit" className="boton-agregar">
          Crear
        </button>
      </form>

      <h2>Mis incidencias</h2>

      {error && <p className="mensaje-error">{error}</p>}

      <div className="tabla-scroll">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Artículo</th>
              <th>Pedido</th>
              <th>Prioridad</th>
              <th>Estado</th>
              <th>Asignado a</th>
              <th>Creado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {incidencias.length === 0 && (
              <tr>
                <td colSpan={8}>No tenés incidencias cargadas.</td>
              </tr>
            )}

            {incidencias.map((inc) => (
              <Fragment key={inc.id_incidencia}>
                <tr>
                  <td>{inc.id_incidencia}</td>
                  <td>{inc.articulo_descripcion}</td>
                  <td className="celda-pedido" title={inc.descripcion_pedido}>
                    {inc.descripcion_pedido}
                  </td>
                  <td>{PRIORIDADES[inc.prioridad] ?? inc.prioridad}</td>
                  <td>
                    <span className={`estado estado-${inc.id_estado}`}>
                      {inc.estado}
                    </span>
                  </td>
                  <td>
                    {inc.asignado_a_nombre
                      ? `${inc.asignado_a_nombre} ${inc.asignado_a_apellido}`
                      : "—"}
                  </td>
                  <td>{fecha(inc.creado)}</td>
                  <td className="celda-acciones">
                    {puedeCancelar(inc) && (
                      <button
                        type="button"
                        className="boton-eliminar"
                        onClick={() => cancelar(inc)}
                      >
                        Cancelar
                      </button>
                    )}
                    {puedeFinalizar(inc) && (
                      <button
                        type="button"
                        className="boton-editar"
                        onClick={() => {
                          // Solo una acción abierta a la vez: abrir Finalizar cierra Asignar
                          setAsignandoId(null);
                          setFinalizandoId(inc.id_incidencia);
                          setResolucion("");
                        }}
                      >
                        Finalizar
                      </button>
                    )}
                    {puedeAsignar(inc) && (
                      <button
                        type="button"
                        className="boton-asignar"
                        onClick={() => abrirAsignar(inc)}
                      >
                        Asignar
                      </button>
                    )}
                  </td>
                </tr>

                {finalizandoId === inc.id_incidencia && (
                  <tr className="fila-accion">
                    <td colSpan={8}>
                      <div className="accion-inline">
                        <label>Resolución:</label>
                        <input
                          type="text"
                          value={resolucion}
                          maxLength={255}
                          placeholder="Contá qué se hizo"
                          onChange={(evento) => setResolucion(evento.target.value)}
                          autoFocus
                        />
                        <button
                          type="button"
                          className="boton-agregar"
                          onClick={() => finalizar(inc)}
                        >
                          Aceptar
                        </button>
                        <button
                          type="button"
                          onClick={() => setFinalizandoId(null)}
                        >
                          Cerrar
                        </button>
                      </div>
                    </td>
                  </tr>
                )}

                {asignandoId === inc.id_incidencia && (
                  <tr className="fila-accion">
                    <td colSpan={8}>
                      <div className="accion-inline">
                        <label>Asignar a:</label>
                        <select
                          value={idDestino}
                          onChange={(evento) => setIdDestino(evento.target.value)}
                        >
                          <option value="">
                            Elegir empleado de Sistemas...
                          </option>
                          {usuariosSistemas.map((u) => (
                            <option key={u.id_usuario} value={u.id_usuario}>
                              {u.apellidos}, {u.nombres}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          className="boton-agregar"
                          onClick={() => asignar(inc)}
                        >
                          Aceptar
                        </button>
                        <button
                          type="button"
                          onClick={() => setAsignandoId(null)}
                        >
                          Cerrar
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default MisIncidencias;
