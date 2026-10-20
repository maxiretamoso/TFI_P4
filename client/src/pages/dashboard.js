import { api } from "../api.js";
import { esc, fecha, fechaHora, cargando, mensajeError, badgeEstado } from "../ui.js";

export async function pintar(zona) {
  zona.innerHTML = `<div class="dashboard">${cargando("Cargando resumen...")}</div>`;

  let resumen = null;
  let error = "";

  try {
    resumen = await api.get("/dashboard");
  } catch (e) {
    error = e.message;
  }

  if (error) {
    zona.innerHTML = `<div class="dashboard">${mensajeError(error)}</div>`;
    return;
  }

  const maximoFecha = Math.max(...resumen.porFecha.map((f) => f.total), 1);

  const kpis = resumen.porEstado
    .map(
      (f) => `<div class="kpi">
        <span class="kpi-numero">${f.total}</span>
        <span class="kpi-etiqueta">${esc(f.estado)}</span>
      </div>`
    )
    .join("");

  let cuerpoFecha = `<p class="dashboard-vacio">Todavía no hay incidencias cargadas.</p>`;

  if (resumen.porFecha.length > 0) {
    cuerpoFecha = resumen.porFecha
      .map(
        (f) => `<div class="barra-fila">
          <span class="barra-etiqueta">${fecha(f.fecha)}</span>
          <div class="barra-contenedor">
            <div class="barra" style="width: ${(f.total / maximoFecha) * 100}%"></div>
          </div>
          <span class="barra-valor">${f.total}</span>
        </div>`
      )
      .join("");
  }

  let cuerpoPrioritarias = `<p class="dashboard-vacio">No hay incidencias de prioridad Alta.</p>`;

  if (resumen.prioritarias.length > 0) {
    cuerpoPrioritarias = `<div class="tabla-scroll">
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
          ${resumen.prioritarias
            .map(
              (inc) => `<tr>
                <td>${inc.id_incidencia}</td>
                <td>${esc(inc.articulo_desc)}</td>
                <td class="celda-pedido-larga" title="${esc(inc.descripcion_pedido)}">${esc(inc.descripcion_pedido)}</td>
                <td>${badgeEstado(inc)}</td>
                <td>${fechaHora(inc.creado)}</td>
              </tr>`
            )
            .join("")}
        </tbody>
      </table>
    </div>`;
  }

  zona.innerHTML = `
    <div class="dashboard">
      <h2>Dashboard</h2>

      <div class="kpis">
        <div class="kpi">
          <span class="kpi-numero">${resumen.total}</span>
          <span class="kpi-etiqueta">Incidencias totales</span>
        </div>
        ${kpis}
      </div>

      <div class="tarjeta-dashboard">
        <h3>Totales por fecha</h3>
        ${cuerpoFecha}
      </div>

      <div class="tarjeta-dashboard">
        <h3>Incidencias prioritarias</h3>
        ${cuerpoPrioritarias}
      </div>
    </div>`;
}
