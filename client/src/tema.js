const CLAVE = "tema";

export function temaOscuro() {
  return document.documentElement.getAttribute("data-bs-theme") === "dark";
}

export function alternarTema() {
  const nuevo = temaOscuro() ? "light" : "dark";
  document.documentElement.setAttribute("data-bs-theme", nuevo);
  try {
    localStorage.setItem(CLAVE, nuevo);
  } catch {
    // sin almacenamiento el tema dura hasta recargar
  }
}

export function botonTema() {
  const oscuro = temaOscuro();
  const texto = oscuro ? "Cambiar a modo claro" : "Cambiar a modo oscuro";
  return `<button type="button" class="boton-tema" id="boton-tema" aria-label="${texto}" title="${texto}">
    <span aria-hidden="true">${oscuro ? "☀︎" : "☾"}</span>
  </button>`;
}

export function activarBotonTema(raiz) {
  raiz.querySelector("#boton-tema")?.addEventListener("click", (evento) => {
    alternarTema();
    evento.currentTarget.outerHTML = botonTema();
    activarBotonTema(raiz);
  });
}
