import { PRIORIDADES, PRIORIDAD_ALTA, ESTADOS, SIN_RESOLVER } from "../../../shared/constantes.js";
import { api } from "../api.js";
import { esc, cargando, mensajeError, badgeEstado, fecha, fechaHora, nombreDelAsignado } from "../ui/ui.js";

const COLOR_ESTADO = {
  [ESTADOS.PENDIENTE]: "var(--gim-pendiente)",
  [ESTADOS.EN_PROCESO]: "var(--gim-proceso)",
  [ESTADOS.RESUELTA]: "var(--gim-resuelta)",
  [ESTADOS.CANCELADA]: "var(--gim-cancelada)",
};

const NOMBRE_EN_PLURAL = {
  [ESTADOS.PENDIENTE]: "Pendientes",
  [ESTADOS.EN_PROCESO]: "En proceso",
  [ESTADOS.RESUELTA]: "Resueltas",
  [ESTADOS.CANCELADA]: "Canceladas",
};

const RADIO_TORTA = 15.915;

function enlaceALista(filtros, etiqueta) {
  const consulta = new URLSearchParams(filtros);
  if (etiqueta) consulta.set("etiqueta", etiqueta);
  return `#/?${consulta}`;
}

function porcentaje(parte, total) {
  return total > 0 ? Math.round((parte / total) * 100) : 0;
}

// Torta hecha con círculos SVG: cada estado es un trazo cuyo largo es su porcentaje.
function graficoPorEstado(resumen) {
  let acumulado = 0;
  const tramos = resumen.porEstado
    .filter((f) => f.total > 0)
    .map((f) => {
      const largo = (f.total / resumen.total) * 100;
      const tramo = `<circle cx="21" cy="21" r="${RADIO_TORTA}" fill="none" stroke="${COLOR_ESTADO[f.id_estado]}"
        stroke-width="6" stroke-dasharray="${largo} ${100 - largo}" stroke-dashoffset="${25 - acumulado}"></circle>`;
      acumulado += largo;
      return tramo;
    })
    .join("");

  const referencias = resumen.porEstado
    .map(
      (f) => `<li>
        <a class="referencia-enlace" href="#/?estado=${f.id_estado}">
          <span class="punto" style="background: ${COLOR_ESTADO[f.id_estado]}"></span>
          ${NOMBRE_EN_PLURAL[f.id_estado] ?? esc(f.estado)} <strong>${f.total}</strong>
          <span class="porcentaje">${porcentaje(f.total, resumen.total)}%</span>
        </a>
      </li>`
    )
    .join("");

  const descripcion = resumen.porEstado
    .map((f) => `${NOMBRE_EN_PLURAL[f.id_estado] ?? f.estado}: ${f.total}`)
    .join(", ");

  return `<div class="grafico-torta">
    <svg viewBox="0 0 42 42" role="img" aria-label="Incidencias por estado. ${esc(descripcion)}">
      <circle cx="21" cy="21" r="${RADIO_TORTA}" fill="none" stroke="var(--gim-borde)" stroke-width="6"></circle>
      ${tramos}
      <a href="#/" class="torta-enlace" aria-label="Ver todas las incidencias">
        <circle cx="21" cy="21" r="11" class="torta-fondo-centro"></circle>
        <text x="21" y="23.5" text-anchor="middle" class="torta-centro">${resumen.total}</text>
      </a>
    </svg>
    <ul class="referencias">${referencias}</ul>
  </div>`;
}

function barrasHorizontales(filas) {
  if (filas.length === 0) return `<p class="texto-grafico">Sin datos todavía.</p>`;

  const maximo = Math.max(...filas.map((f) => f.total), 1);
  return `<ul class="barras">${filas
    .map(
      (f) => `<li>
        <a class="fila-enlace" href="${f.enlace}">
          <span class="barra-nombre">${esc(f.nombre)}</span>
          <span class="barra-pista"><span class="barra-relleno" style="width: ${(f.total / maximo) * 100}%"></span></span>
          <span class="barra-total">${f.total}</span>
        </a>
      </li>`
    )
    .join("")}</ul>`;
}

function graficoPorFecha(resumen) {
  return barrasHorizontales(
    resumen.porFecha.map((f) => ({
      nombre: fecha(f.fecha),
      total: f.total,
      enlace: enlaceALista({ fecha: f.fecha }),
    }))
  );
}

function graficoPorPrioridad(resumen) {
  const totales = new Map(resumen.porPrioridad.map((f) => [f.prioridad, f.total]));
  const filas = Object.entries(PRIORIDADES)
    .reverse()
    .map(([valor, nombre]) => ({
      nombre,
      total: totales.get(Number(valor)) ?? 0,
      enlace: enlaceALista({ prioridad: valor }),
    }));
  return barrasHorizontales(filas);
}

function graficoPorArea(resumen) {
  return barrasHorizontales(
    resumen.porArea.map((f) => ({
      nombre: f.area,
      total: f.total,
      enlace: enlaceALista({ area: f.id_area }, `área ${f.area}`),
    }))
  );
}

function graficoPorCategoria(resumen) {
  return barrasHorizontales(
    resumen.porCategoria.map((f) => ({
      nombre: f.categoria,
      total: f.total,
      enlace: enlaceALista({ categoria: f.id_categoria }, `categoría ${f.categoria}`),
    }))
  );
}

function tablaDePrioritarias(resumen) {
  if (resumen.prioritarias.length === 0) {
    return `<p class="texto-grafico">No hay incidencias de prioridad Alta sin resolver.</p>`;
  }
  const filas = resumen.prioritarias
    .map(
      (inc) => `<tr class="fila-clicable" data-enlace="${enlaceALista({ estado: SIN_RESOLVER.join(","), prioridad: PRIORIDAD_ALTA })}">
        <td>${inc.id_incidencia}</td>
        <td>${esc(inc.articulo)}</td>
        <td class="celda-pedido">${esc(inc.descripcion_pedido)}</td>
        <td>${badgeEstado(inc)}</td>
        <td>${nombreDelAsignado(inc.asignado_nombres, inc.asignado_apellidos)}</td>
        <td>${esc(inc.creador_nombres)} ${esc(inc.creador_apellidos)}</td>
        <td>${fechaHora(inc.creado)}</td>
      </tr>`
    )
    .join("");
  return `<div class="tabla-scroll tabla-dashboard">
    <table>
      <thead><tr><th>#</th><th>Artículo</th><th>Pedido</th><th>Estado</th><th>Asignada a</th><th>Creada por</th><th>Fecha de creación</th></tr></thead>
      <tbody>${filas}</tbody>
    </table>
  </div>
  <a class="enlace-ver-todas" href="#/">Ver todas las incidencias</a>`;
}

function cargaDeEmpleados(resumen) {
  if (resumen.cargaPorEmpleado.length === 0) {
    return `<p class="texto-grafico">No hay empleados de Sistemas activos.</p>`;
  }

  const maximo = Math.max(...resumen.cargaPorEmpleado.map((e) => e.en_proceso + e.resueltas + e.canceladas), 1);
  const filas = resumen.cargaPorEmpleado
    .map(
      (e) => `<li>
        <a class="fila-enlace" href="${enlaceALista({ asignado: e.id_usuario }, `asignadas a ${e.nombres} ${e.apellidos}`)}">
          <span class="barra-nombre carga-nombre">${esc(e.nombres)} ${esc(e.apellidos)}</span>
          <span class="barra-pista carga-pista">
            <span class="carga-en-proceso" style="width: ${(e.en_proceso / maximo) * 100}%"></span>
            <span class="carga-resueltas" style="width: ${(e.resueltas / maximo) * 100}%"></span>
            <span class="carga-canceladas" style="width: ${(e.canceladas / maximo) * 100}%"></span>
          </span>
          <span class="carga-numeros">${e.en_proceso} / ${e.resueltas} / ${e.canceladas}</span>
        </a>
      </li>`
    )
    .join("");
  return `<ul class="barras">${filas}</ul>
    <p class="referencias-linea">
      <span><span class="punto" style="background: var(--gim-proceso)"></span>En proceso</span>
      <span><span class="punto" style="background: var(--gim-resuelta)"></span>Resueltas</span>
      <span><span class="punto" style="background: var(--gim-cancelada)"></span>Canceladas</span>
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

    <div class="grilla-resumen">
      <section class="tarjeta-grafico">
        <h3>Por estado</h3>
        ${graficoPorEstado(resumen)}
      </section>
      <section class="tarjeta-grafico">
        <h3>Carga de trabajo del equipo de Sistemas</h3>
        ${cargaDeEmpleados(resumen)}
      </section>
    </div>

    <section class="tarjeta-grafico tarjeta-completa">
      <h3>Incidencias prioritarias</h3>
      ${tablaDePrioritarias(resumen)}
    </section>

    <div class="grilla-dos">
      <section class="tarjeta-grafico">
        <h3>Por fecha</h3>
        ${graficoPorFecha(resumen)}
      </section>
      <section class="tarjeta-grafico">
        <h3>Por prioridad</h3>
        ${graficoPorPrioridad(resumen)}
      </section>
    </div>

    <div class="grilla-dos">
      <section class="tarjeta-grafico">
        <h3>Por área</h3>
        ${graficoPorArea(resumen)}
      </section>
      <section class="tarjeta-grafico">
        <h3>Por categoría</h3>
        ${graficoPorCategoria(resumen)}
      </section>
    </div>
`;

  zona.querySelector(".tabla-dashboard")?.addEventListener("click", (evento) => {
    const fila = evento.target.closest("tr[data-enlace]");
    if (fila) window.location.hash = fila.dataset.enlace;
  });
}
