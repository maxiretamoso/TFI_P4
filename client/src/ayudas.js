// Globo de ayuda propio: reemplaza al title del navegador, que no se puede estilizar.
// data-ayuda="texto" muestra ese texto; data-ayuda-si-cortado muestra el contenido solo si está recortado.
const SELECTOR = "[data-ayuda], [data-ayuda-si-cortado]";
const SEPARACION = 8;

let globo = null;
let actual = null;

function crearGlobo() {
  globo = document.createElement("div");
  globo.className = "globo-ayuda";
  globo.setAttribute("role", "tooltip");
  document.body.appendChild(globo);
}

function textoDe(elemento) {
  if (elemento.dataset.ayuda) return elemento.dataset.ayuda;
  const cortado = elemento.scrollWidth > elemento.clientWidth;
  return cortado ? elemento.textContent.trim() : "";
}

function ubicar(elemento) {
  const caja = elemento.getBoundingClientRect();
  const medida = globo.getBoundingClientRect();

  let arriba = caja.top - medida.height - SEPARACION;
  const debajo = arriba < SEPARACION;
  if (debajo) arriba = caja.bottom + SEPARACION;

  const centro = caja.left + caja.width / 2;
  const izquierda = Math.max(
    SEPARACION,
    Math.min(centro - medida.width / 2, window.innerWidth - medida.width - SEPARACION)
  );

  globo.style.top = `${arriba + window.scrollY}px`;
  globo.style.left = `${izquierda + window.scrollX}px`;
  globo.style.setProperty("--flecha", `${centro - izquierda}px`);
  globo.classList.toggle("debajo", debajo);
}

function mostrar(elemento) {
  const texto = textoDe(elemento);
  if (!texto) return ocultar();
  if (!globo) crearGlobo();
  globo.textContent = texto;
  globo.classList.add("visible");
  ubicar(elemento);
  actual = elemento;
}

// Oculto sigue ocupando lugar: se lo devuelve a la esquina para que no ensanche la página.
function ocultar() {
  if (globo) {
    globo.classList.remove("visible");
    globo.style.left = "0px";
    globo.style.top = "0px";
  }
  actual = null;
}

function alPasar(evento) {
  const elemento = evento.target.closest?.(SELECTOR);
  if (elemento === actual) return;
  if (elemento) mostrar(elemento);
  else ocultar();
}

export function activarAyudas() {
  document.addEventListener("mouseover", alPasar);
  document.addEventListener("focusin", alPasar);
  document.addEventListener("focusout", ocultar);
  document.addEventListener("click", ocultar);
  window.addEventListener("scroll", ocultar, true);
  window.addEventListener("hashchange", ocultar);
  window.addEventListener("resize", ocultar);
}
