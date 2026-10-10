import { Fragment, useEffect, useState } from "react";
import { api } from "../api/cliente.js";
import { useAuth } from "../auth/AuthContext.jsx";
import { PRIORIDADES } from "./prioridades.js";
import "../styles/categorias.css";
import "./incidencias.css";
import Cargando from "../components/Cargando.jsx";

function MisAsignadas() {
  const { usuario } = useAuth();

  const [incidencias, setIncidencias] = useState([]);
  const [usuariosSistemas, setUsuariosSistemas] = useState([]);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(true);

  // Acciones abiertas en la tabla (null = ninguna)
  const [finalizandoId, setFinalizandoId] = useState(null);
  const [resolucion, setResolucion] = useState("");
  const [asignandoId, setAsignandoId] = useState(null);
  const [idDestino, setIdDestino] = useState("");

  async function cargar() {
    try {
      setIncidencias(await api.get("/incidencias/asignadas"));
    } catch (e) {
      setError(e.message);
    }
  }

  useEffect(() => {
    cargar().finally(() => setCargando(false));
  }, []);

  if (cargando) return <Cargando texto="Cargando incidencias asignadas..." />;

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
    // Solo una acción abierta a la vez: abrir Asignar cierra Finalizar
    setFinalizandoId(null);
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

  // Todas las filas son mías (asignado_a = yo, lo garantiza el endpoint)
  // → las reglas se simplifican respecto de Mis incidencias
  function puedeCancelar(inc) {
    return inc.id_estado === 1 && usuario.rol === 3;
  }

  function puedeFinalizar(inc) {
    return inc.id_estado !== 3 && inc.id_estado !== 4;
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
      <h2>Mis asignadas</h2>

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
                <td colSpan={8}>No hay incidencias asignadas.</td>
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

export default MisAsignadas;
