import { api } from "../api.js";
import { esc, cargando, mensajeError, PRIORIDADES, ESTADOS, badgeEstado, fechaHora } from "../ui.js";

const COLOR_ESTADO = {
  [ESTADOS.PENDIENTE]: "var(--gim-pendiente)",
  [ESTADOS.EN_PROCESO]: "var(--gim-proceso)",
  [ESTADOS.RESUELTA]: "var(--gim-resuelta)",
  [ESTADOS.CANCELADA]: "var(--gim-cancelada)",
};

function porcentaje(parte, total) {
  return total > 0 ? Math.round((parte / total) * 100) : 0;
}

function tarjetasDeTotales(resumen) {
  const porEstado = resumen.porEstado
    .map(
      (f) => `<div class="kpi">
        <span class="kpi-etiqueta">${esc(f.estado)}</span>
        <span class="kpi-numero" style="color: ${COLOR_ESTADO[f.id_estado] ?? "inherit"}">${f.total}</span>
      </div>`
    )
    .join("");

  return `<div class="kpis">
    <div class="kpi">
      <span class="kpi-etiqueta">Total</span>
      <span class="kpi-numero">${resumen.total}</span>
    </div>
    ${porEstado}
  </div>`;
}

// Torta hecha con círculos SVG: cada estado es un trazo cuyo largo es su porcentaje.
function graficoPorEstado(resumen) {
  let acumulado = 0;
  const segmentos = resumen.porEstado
    .filter((f) => f.total > 0)
    .map((f) => {
      const largo = (f.total / resumen.total) * 100;
      const segmento = `<circle cx="21" cy="21" r="15.915" fill="none" stroke="${COLOR_ESTADO[f.id_estado]}"
        stroke-width="6" stroke-dasharray="${largo} ${100 - largo}" stroke-dashoffset="${25 - acumulado}"></circle>`;
      acumulado += largo;
      return segmento;
    })
    .join("");

  const referencias = resumen.porEstado
    .map(
      (f) => `<li>
        <span class="punto" style="background: ${COLOR_ESTADO[f.id_estado]}"></span>
        ${esc(f.estado)} <strong>${porcentaje(f.total, resumen.total)}%</strong>
      </li>`
    )
    .join("");

  const descripcion = resumen.porEstado.map((f) => `${f.estado}: ${f.total}`).join(", ");

  return `<div class="grafico-torta">
    <svg viewBox="0 0 42 42" role="img" aria-label="Incidencias por estado. ${esc(descripcion)}">
      <circle cx="21" cy="21" r="15.915" fill="none" stroke="var(--gim-borde)" stroke-width="6"></circle>
      ${segmentos}
      <text x="21" y="23.5" text-anchor="middle" class="torta-centro">${resumen.total}</text>
    </svg>
    <ul class="referencias">${referencias}</ul>
  </div>`;
}

function claveDeFecha(fecha) {
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const dia = String(fecha.getDate()).padStart(2, "0");
  return `${fecha.getFullYear()}-${mes}-${dia}`;
}

function graficoPorDia(resumen) {
  const totales = new Map(resumen.porFecha.map((f) => [f.fecha, f.total]));
  const dias = [];
  for (let atras = resumen.dias - 1; atras >= 0; atras--) {
    const fecha = new Date();
    fecha.setDate(fecha.getDate() - atras);
    dias.push({ fecha, total: totales.get(claveDeFecha(fecha)) ?? 0 });
  }

  const maximo = Math.max(...dias.map((d) => d.total), 1);
  const columnas = dias
    .map((d, i) => {
      const etiqueta = `${d.fecha.getDate()}/${d.fecha.getMonth() + 1}`;
      const mostrarEtiqueta = (dias.length - 1 - i) % 2 === 0;
      return `<div class="columna" title="${etiqueta}: ${d.total}">
        <span class="columna-valor">${d.total || ""}</span>
        <span class="columna-barra" style="height: ${(d.total / maximo) * 100}%"></span>
        <span class="columna-fecha">${mostrarEtiqueta ? etiqueta : ""}</span>
      </div>`;
    })
    .join("");

  const suma = dias.reduce((acumulado, d) => acumulado + d.total, 0);

  return `<div class="grafico-columnas" role="img" aria-label="Incidencias creadas por día en los últimos ${resumen.dias} días: ${suma} en total">
      ${columnas}
    </div>
    <p class="texto-grafico">${suma === 0 ? "No se crearon incidencias en este período." : `${suma} en total en el período.`}</p>`;
}

function barrasHorizontales(filas) {
  if (filas.length === 0) return `<p class="texto-grafico">Sin datos todavía.</p>`;

  const maximo = Math.max(...filas.map((f) => f.total), 1);
  return `<ul class="barras">${filas
    .map(
      (f) => `<li>
        <span class="barra-nombre">${esc(f.nombre)}</span>
        <span class="barra-pista"><span class="barra-relleno" style="width: ${(f.total / maximo) * 100}%"></span></span>
        <span class="barra-total">${f.total}</span>
      </li>`
    )
    .join("")}</ul>`;
}

function graficoPorPrioridad(resumen) {
  const totales = new Map(resumen.porPrioridad.map((f) => [f.prioridad, f.total]));
  const filas = Object.entries(PRIORIDADES)
    .reverse()
    .map(([valor, nombre]) => ({ nombre, total: totales.get(Number(valor)) ?? 0 }));
  return barrasHorizontales(filas);
}

function graficoPorArea(resumen) {
  return barrasHorizontales(resumen.porArea.map((f) => ({ nombre: f.area, total: f.total })));
}

function graficoPorCategoria(resumen) {
  return barrasHorizontales(
    resumen.porCategoria.map((f) => ({ nombre: f.categoria, total: f.total }))
  );
}

function tarjetasDeIndicadores(resumen) {
  const resueltas = resumen.porEstado.find((f) => f.id_estado === ESTADOS.RESUELTA)?.total ?? 0;
  const { abiertas, altas_abiertas, ultimos_7_dias, sin_asignar } = resumen.indicadores;
  const indicadores = [
    ["Abiertas", abiertas, "pendientes y en proceso"],
    ["Alta sin resolver", altas_abiertas, "prioridad Alta abiertas"],
    ["Últimos 7 días", ultimos_7_dias, "incidencias creadas"],
    ["Sin asignar", sin_asignar, "pendientes del Director"],
    ["Resueltas", `${porcentaje(resueltas, resumen.total)}%`, "del total"],
  ];
  return `<div class="indicadores">${indicadores
    .map(
      ([titulo, valor, detalle]) => `<div class="indicador">
        <span class="indicador-valor">${valor}</span>
        <span class="indicador-titulo">${titulo}</span>
        <span class="indicador-detalle">${detalle}</span>
      </div>`
    )
    .join("")}</div>`;
}

function antiguedad(fecha) {
  const dias = Math.floor((Date.now() - new Date(fecha)) / 86400000);
  if (dias <= 0) return "hoy";
  return dias === 1 ? "hace 1 día" : `hace ${dias} días`;
}

function tablaDePrioritarias(resumen) {
  if (resumen.prioritarias.length === 0) {
    return `<p class="texto-grafico">No hay incidencias de prioridad Alta abiertas.</p>`;
  }
  const filas = resumen.prioritarias
    .map(
      (inc) => `<tr>
        <td>${inc.id_incidencia}</td>
        <td>${esc(inc.articulo)}</td>
        <td class="celda-pedido" title="${esc(inc.descripcion_pedido)}">${esc(inc.descripcion_pedido)}</td>
        <td>${badgeEstado(inc)}</td>
        <td>${esc(inc.asignado_nombres)} ${esc(inc.asignado_apellidos)}</td>
        <td>${esc(inc.creador_nombres)} ${esc(inc.creador_apellidos)}</td>
        <td title="${fechaHora(inc.creado)}">${antiguedad(inc.creado)}</td>
      </tr>`
    )
    .join("");
  return `<div class="tabla-scroll tabla-dashboard">
    <table>
      <thead><tr><th>#</th><th>Artículo</th><th>Pedido</th><th>Estado</th><th>Asignada a</th><th>Creada por</th><th>Antigüedad</th></tr></thead>
      <tbody>${filas}</tbody>
    </table>
  </div>
  <a class="enlace-ver-todas" href="#/">Ver todas las incidencias</a>`;
}

function cargaDeEmpleados(resumen) {
  if (resumen.cargaPorEmpleado.length === 0) {
    return `<p class="texto-grafico">No hay empleados de Sistemas activos.</p>`;
  }

  const maximo = Math.max(...resumen.cargaPorEmpleado.map((e) => e.abiertas + e.resueltas), 1);
  const filas = resumen.cargaPorEmpleado
    .map(
      (e) => `<li>
        <span class="barra-nombre carga-nombre">${esc(e.nombres)} ${esc(e.apellidos)}</span>
        <span class="barra-pista carga-pista">
          <span class="carga-abiertas" style="width: ${(e.abiertas / maximo) * 100}%"></span>
          <span class="carga-resueltas" style="width: ${(e.resueltas / maximo) * 100}%"></span>
        </span>
        <span class="carga-numeros" title="abiertas / resueltas">${e.abiertas} / ${e.resueltas}</span>
      </li>`
    )
    .join("");
  return `<ul class="barras">${filas}</ul>
    <p class="referencias-linea">
      <span><span class="punto" style="background: var(--gim-pendiente)"></span>Abiertas</span>
      <span><span class="punto" style="background: var(--gim-resuelta)"></span>Resueltas</span>
    </p>`;
}

export async function pintar(zona) {
  zona.innerHTML = cargando("Cargando estadísticas...");

  let resumen;
  try {
    resumen = await api.get("/dashboard");
  } catch (e) {
    zona.innerHTML = mensajeError(e.message, { fijo: true });
    return;
  }

  zona.innerHTML = `
    <h2>Dashboard</h2>
    ${tarjetasDeTotales(resumen)}
    ${tarjetasDeIndicadores(resumen)}

    <div class="grilla-graficos">
      <section class="tarjeta-grafico">
        <h3>Por estado</h3>
        ${graficoPorEstado(resumen)}
      </section>
      <section class="tarjeta-grafico grafico-ancho">
        <h3>Creadas por día (últimos ${resumen.dias} días)</h3>
        ${graficoPorDia(resumen)}
      </section>
    </div>

    <section class="tarjeta-grafico tarjeta-completa">
      <h3>Incidencias prioritarias</h3>
      ${tablaDePrioritarias(resumen)}
    </section>

    <div class="grilla-tres">
      <section class="tarjeta-grafico">
        <h3>Por prioridad</h3>
        ${graficoPorPrioridad(resumen)}
      </section>
      <section class="tarjeta-grafico">
        <h3>Por área</h3>
        ${graficoPorArea(resumen)}
      </section>
      <section class="tarjeta-grafico">
        <h3>Por categoría</h3>
        ${graficoPorCategoria(resumen)}
      </section>
    </div>

    <section class="tarjeta-grafico tarjeta-completa">
      <h3>Carga de trabajo del equipo de Sistemas</h3>
      ${cargaDeEmpleados(resumen)}
    </section>`;
}
