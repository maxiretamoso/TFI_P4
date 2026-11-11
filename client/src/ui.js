import { ROLES, ESTADOS } from "../../shared/constantes.js";
export const NOMBRES_ROL = {
  [ROLES.DIRECTOR]: "Director",
  [ROLES.EMPLEADO_SISTEMAS]: "Sistemas",
  [ROLES.EMPLEADO_MUNICIPAL]: "Municipal",
};

export function esc(texto) {
  return String(texto ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function fecha(iso) {
  const [anio, mes, dia] = iso.split("-");
  return `${dia}/${mes}/${anio}`;
}

export function fechaHora(iso) {
  return new Date(iso).toLocaleString("es-AR", {
    timeZone: "America/Argentina/Buenos_Aires",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
}

export function cargando(texto = "Cargando...") {
  return `<p class="cargando" role="status" aria-live="polite">
    <span class="spinner-border spinner-border-sm" aria-hidden="true"></span>
    ${esc(texto)}
  </p>`;
}

export function mensajeError(texto, { fijo = false } = {}) {
  if (!texto) return "";
  return `<p class="mensaje-error${fijo ? " mensaje-fijo" : ""}" role="alert">${esc(texto)}</p>`;
}

export function nombreDelAsignado(nombres, apellidos) {
  return nombres ? `${esc(nombres)} ${esc(apellidos)}` : "Sin asignar";
}

export function badgeEstado(inc) {
  return `<span class="estado estado-${inc.id_estado}">${esc(inc.estado)}</span>`;
}

function botonDePagina(numero, texto, { activa = false, deshabilitada = false, etiqueta = "" } = {}) {
  const clases = ["page-item", activa && "active", deshabilitada && "disabled"].filter(Boolean).join(" ");
  const aria = etiqueta ? ` aria-label="${etiqueta}"` : "";
  const actual = activa ? ` aria-current="page"` : "";
  return `<li class="${clases}">
    <button type="button" class="page-link" data-pagina="${numero}"${aria}${actual}
      ${deshabilitada || activa ? "disabled" : ""}>${texto}</button>
  </li>`;
}

export const POR_PAGINA = 15;

// Recorta una lista ya cargada a la página pedida, con los mismos datos que devuelve la API.
export function paginar(lista, pagina, totalSinFiltros = lista.length) {
  const paginas = Math.max(Math.ceil(lista.length / POR_PAGINA), 1);
  const actual = Math.min(Math.max(pagina, 1), paginas);
  return {
    items: lista.slice((actual - 1) * POR_PAGINA, actual * POR_PAGINA),
    pagina: actual,
    paginas,
    total: lista.length,
    total_sin_filtros: totalSinFiltros,
    limite: POR_PAGINA,
  };
}

export function paginacion(
  { pagina, paginas, total, total_sin_filtros: totalSinFiltros = total, limite },
  [singular, plural] = ["incidencia", "incidencias"]
) {
  if (totalSinFiltros === 0) return "";
  const filtrado = total !== totalSinFiltros;

  if (paginas <= 1) {
    const texto = filtrado
      ? `${total} de ${totalSinFiltros} ${plural}`
      : `${total} ${total === 1 ? singular : plural}`;
    return `<p class="texto-paginacion">Mostrando ${texto}</p>`;
  }

  const desde = (pagina - 1) * limite + 1;
  const hasta = Math.min(pagina * limite, total);
  const enTotal = filtrado ? ` (${totalSinFiltros} en total)` : "";
  const resumen = `<p class="texto-paginacion">Mostrando ${desde}–${hasta} de ${total}${enTotal}</p>`;

  const inicio = Math.max(1, Math.min(pagina - 2, paginas - 4));
  const fin = Math.min(paginas, inicio + 4);
  let numeros = "";
  for (let n = inicio; n <= fin; n++) {
    numeros += botonDePagina(n, n, { activa: n === pagina });
  }

  return `<div class="barra-paginacion">
    ${resumen}
    <nav aria-label="Paginación">
      <ul class="pagination pagination-sm mb-0">
        ${botonDePagina(pagina - 1, "&laquo;", { deshabilitada: pagina === 1, etiqueta: "Página anterior" })}
        ${numeros}
        ${botonDePagina(pagina + 1, "&raquo;", { deshabilitada: pagina === paginas, etiqueta: "Página siguiente" })}
      </ul>
    </nav>
  </div>`;
}

const URL_SERVIDOR = "http://localhost:3000";

export function urlDelAvatar(archivo) {
  return archivo ? `${URL_SERVIDOR}/publico/avatares/${archivo}` : "";
}

function iniciales(usuario) {
  return `${usuario.nombres?.[0] ?? ""}${usuario.apellidos?.[0] ?? ""}`.toUpperCase();
}

export function avatarHtml(usuario, clase = "") {
  const url = urlDelAvatar(usuario.avatar);
  return url
    ? `<img class="avatar ${clase}" src="${url}" alt="">`
    : `<span class="avatar avatar-iniciales ${clase}" aria-hidden="true">${esc(iniciales(usuario))}</span>`;
}
