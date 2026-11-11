const CLAVE = "tema";

const ICONO_SOL = `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4.5"/><g stroke-linecap="round"><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"/></g></svg>`;
const ICONO_LUNA = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/></svg>`;

function temaOscuro() {
  return document.documentElement.getAttribute("data-bs-theme") === "dark";
}

function alternarTema() {
  const nuevo = temaOscuro() ? "light" : "dark";
  document.documentElement.setAttribute("data-bs-theme", nuevo);
  try {
    localStorage.setItem(CLAVE, nuevo);
  } catch {
    // sin almacenamiento el tema dura hasta recargar
  }
}

export function botonTema() {
  return `<button type="button" class="interruptor-tema" id="boton-tema" role="switch"
      aria-checked="${temaOscuro()}" aria-label="Modo oscuro">
    <span class="interruptor-perilla">
      <span class="interruptor-icono icono-sol">${ICONO_SOL}</span>
      <span class="interruptor-icono icono-luna">${ICONO_LUNA}</span>
    </span>
  </button>`;
}

export function activarBotonTema(raiz) {
  raiz.querySelector("#boton-tema")?.addEventListener("click", (evento) => {
    alternarTema();
    evento.currentTarget.setAttribute("aria-checked", String(temaOscuro()));
  });
}
