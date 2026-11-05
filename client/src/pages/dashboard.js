import { api } from "../api.js";
import { esc, cargando, mensajeError, PRIORIDADES, ESTADOS } from "../ui.js";

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

export async function pintar(zona) {
  zona.innerHTML = cargando("Cargando estadísticas...");

  let resumen;
  try {
    resumen = await api.get("/dashboard");
  } catch (e) {
    zona.innerHTML = mensajeError(e.message);
    return;
  }

  zona.innerHTML = `
    <h2>Dashboard</h2>
    ${tarjetasDeTotales(resumen)}

    <div class="grilla-graficos">
      <section class="tarjeta-grafico">
        <h3>Por estado</h3>
        ${graficoPorEstado(resumen)}
      </section>
      <section class="tarjeta-grafico grafico-ancho">
        <h3>Creadas por día (últimos ${resumen.dias} días)</h3>
        ${graficoPorDia(resumen)}
      </section>
      <section class="tarjeta-grafico">
        <h3>Por prioridad</h3>
        ${graficoPorPrioridad(resumen)}
      </section>
      <section class="tarjeta-grafico">
        <h3>Por área</h3>
        ${graficoPorArea(resumen)}
      </section>
    </div>`;
}
