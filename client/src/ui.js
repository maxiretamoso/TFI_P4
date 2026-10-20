export const PRIORIDADES = {
  1: "Baja",
  2: "Media",
  3: "Alta",
};

export const ROLES = {
  1: "Municipal",
  2: "Sistemas",
  3: "Director",
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
