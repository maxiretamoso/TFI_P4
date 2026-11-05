export const ROLES = {
  DIRECTOR: 1,
  EMPLEADO_SISTEMAS: 2,
  EMPLEADO_MUNICIPAL: 3,
};

export const NOMBRES_ROL = {
  [ROLES.DIRECTOR]: "Director",
  [ROLES.EMPLEADO_SISTEMAS]: "Sistemas",
  [ROLES.EMPLEADO_MUNICIPAL]: "Municipal",
};

export const ESTADOS = {
  PENDIENTE: 1,
  EN_PROCESO: 2,
  RESUELTA: 3,
  CANCELADA: 4,
};

export const PRIORIDADES = {
  1: "Baja",
  2: "Media",
  3: "Alta",
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
    dateStyle: "short",
    timeStyle: "short",
  });
}

export function cargando(texto = "Cargando...") {
  return `<p class="cargando" role="status" aria-live="polite">
    <span class="spinner-border spinner-border-sm" aria-hidden="true"></span>
    ${esc(texto)}
  </p>`;
}

export function mensajeError(texto) {
  return texto ? `<p class="mensaje-error" role="alert">${esc(texto)}</p>` : "";
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

export function paginacion({ pagina, paginas, total, limite }) {
  if (total === 0) return "";

  const desde = (pagina - 1) * limite + 1;
  const hasta = Math.min(pagina * limite, total);
  const resumen = `<p class="texto-paginacion">Mostrando ${desde}–${hasta} de ${total}</p>`;
  if (paginas <= 1) return resumen;

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

const URL_SERVIDOR = (import.meta.env.VITE_API_URL || "http://localhost:3000/api/v1").replace(
  /\/api\/v1\/?$/,
  ""
);

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
