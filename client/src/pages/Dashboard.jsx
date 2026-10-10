import { useEffect, useState } from "react";
import { api } from "../api/cliente.js";
import "./Dashboard.css";

// Panel de resumen del director (rol 3): los tres paneles que pide el enunciado.
// El backend agrupa y cuenta (GROUP BY); esta pantalla solo dibuja.
function Dashboard() {
  const [resumen, setResumen] = useState(null);
  const [error, setError] = useState("");

  async function cargar() {
    try {
      setResumen(await api.get("/dashboard"));
    } catch (e) {
      setError(e.message);
    }
  }

  useEffect(() => {
    cargar();
  }, []);

  // Formatear "2026-09-13" a mano: new Date() lo trataría como UTC y en
  // Argentina mostraría el día anterior (trampa clásica de husos horarios)
  function fecha(iso) {
    const [anio, mes, dia] = iso.split("-");
    return `${dia}/${mes}/${anio}`;
  }

  function fechaHora(iso) {
    return new Date(iso).toLocaleString("es-AR", {
      dateStyle: "short",
      timeStyle: "short",
    });
  }

  if (error) {
    return (
      <div className="dashboard">
        <p className="mensaje-error">{error}</p>
      </div>
    );
  }

  if (!resumen) {
    return (
      <div className="dashboard">
        <p className="dashboard-cargando">Cargando resumen...</p>
      </div>
    );
  }

  // El máximo escala las barras: el más alto va al100%, el resto proporcional
  const maximoFecha = Math.max(...resumen.porFecha.map((f) => f.total), 1);

  return (
    <div className="dashboard">
      <h2>Dashboard</h2>

      {/* Panel1: totales según estados (tarjetas KPI) */}
      <div className="kpis">
        <div className="kpi">
          <span className="kpi-numero">{resumen.total}</span>
          <span className="kpi-etiqueta">Incidencias totales</span>
        </div>

        {resumen.porEstado.map((f) => (
          <div className="kpi" key={f.estado}>
            <span className="kpi-numero">{f.total}</span>
            <span className="kpi-etiqueta">{f.estado}</span>
          </div>
        ))}
      </div>

      {/* Panel2: totales por fecha (barras CSS, sin librerías) */}
      <div className="tarjeta-dashboard">
        <h3>Totales por fecha</h3>

        {resumen.porFecha.length === 0 && (
          <p className="dashboard-vacio">Todavía no hay incidencias cargadas.</p>
        )}

        {resumen.porFecha.map((f) => (
          <div className="barra-fila" key={f.fecha}>
            <span className="barra-etiqueta">{fecha(f.fecha)}</span>
            <div className="barra-contenedor">
              <div
                className="barra"
                style={{ width: `${(f.total / maximoFecha) * 100}%` }}
              ></div>
            </div>
            <span className="barra-valor">{f.total}</span>
          </div>
        ))}
      </div>

      {/* Panel3: incidencias prioritarias (prioridad3 = Alta, la regla del backend) */}
      <div className="tarjeta-dashboard">
        <h3>Incidencias prioritarias</h3>

        {resumen.prioritarias.length === 0 && (
          <p className="dashboard-vacio">
            No hay incidencias de prioridad Alta.
          </p>
        )}

        {resumen.prioritarias.length > 0 && (
          <div className="tabla-scroll">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Artículo</th>
                  <th>Pedido</th>
                  <th>Estado</th>
                  <th>Creado</th>
                </tr>
              </thead>
            <tbody>
              {resumen.prioritarias.map((inc) => (
                <tr key={inc.id_incidencia}>
                  <td>{inc.id_incidencia}</td>
                  <td>{inc.articulo_desc}</td>
                  <td className="celda-pedido-larga" title={inc.descripcion_pedido}>
                    {inc.descripcion_pedido}
                  </td>
                  <td>
                    <span className={`estado estado-${inc.id_estado}`}>
                      {inc.estado}
                    </span>
                  </td>
                  <td>{fechaHora(inc.creado)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
