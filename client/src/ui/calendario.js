const mesYAnio = new Intl.DateTimeFormat("es-AR", { month: "long", year: "numeric" });
const fechaCompleta = new Intl.DateTimeFormat("es-AR", { dateStyle: "full" });

function iso(fecha) {
  const dosDigitos = (numero) => String(numero).padStart(2, "0");
  return [String(fecha.getFullYear()).padStart(4, "0"), dosDigitos(fecha.getMonth() + 1), dosDigitos(fecha.getDate())].join("-");
}

export function activarCalendario(filtro) {
  const campo = filtro.querySelector("input");
  const boton = filtro.querySelector(".abrir-calendario");
  const panel = filtro.querySelector(".calendario-fecha");
  let mes;

  function pintar() {
    const hoy = iso(new Date());
    const anio = mes.getFullYear();
    const numeroMes = mes.getMonth();
    const inicio = (mes.getDay() + 6) % 7;
    const cantidad = new Date(anio, numeroMes + 1, 0).getDate();
    const dias = Array.from({ length: inicio + cantidad }, (_, indice) => {
      const dia = indice - inicio + 1;
      if (dia < 1) return "<span></span>";
      const fecha = new Date(anio, numeroMes, dia);
      const valor = iso(fecha);
      return `<button type="button" data-fecha="${valor}" aria-label="${fechaCompleta.format(fecha)}"
        aria-pressed="${valor === campo.value}" ${valor === hoy ? 'aria-current="date"' : ""}
        ${valor < campo.min ? "disabled" : ""}>${dia}</button>`;
    }).join("");
    panel.innerHTML = `
      <div class="calendario-cabecera">
        <button type="button" data-mes="-1" aria-label="Mes anterior" ${iso(mes) <= campo.min ? "disabled" : ""}>‹</button>
        <strong aria-live="polite">${mesYAnio.format(mes)}</strong>
        <button type="button" data-mes="1" aria-label="Mes siguiente">›</button>
      </div>
      <div class="calendario-dias">
        ${["Lu", "Ma", "Mi", "Ju", "Vi", "Sá", "Do"].map((dia) => `<span>${dia}</span>`).join("")}
        ${dias}
      </div>
      <div class="calendario-pie">
        <button type="button" data-fecha="">Borrar</button>
        <button type="button" data-fecha="${hoy}" ${hoy < campo.min ? "disabled" : ""}>Hoy</button>
      </div>`;
  }

  function mostrarFecha() {
    boton.querySelector("[data-fecha-elegida]").textContent = campo.value
      ? campo.value.split("-").reverse().join("/")
      : "Elegir fecha";
  }

  mostrarFecha();
  panel.addEventListener("beforetoggle", (evento) => {
    if (evento.newState !== "open") return;
    const valor = campo.value || iso(new Date());
    const fecha = new Date(`${valor < campo.min ? campo.min : valor}T12:00:00`);
    mes = new Date(fecha.getFullYear(), fecha.getMonth(), 1);
    pintar();
    const rect = boton.getBoundingClientRect();
    const ancho = Math.min(320, window.innerWidth - 24);
    panel.style.left = `${Math.max(12, Math.min(rect.left, window.innerWidth - ancho - 12))}px`;
    panel.style.top = `${Math.max(12, Math.min(rect.bottom + 6, window.innerHeight - 372))}px`;
  });
  panel.addEventListener("click", (evento) => {
    const control = evento.target.closest("button");
    if (!control) return;
    if (control.dataset.mes) {
      const paso = Number(control.dataset.mes);
      mes = new Date(mes.getFullYear(), mes.getMonth() + paso, 1);
      pintar();
      const siguiente = panel.querySelector(`[data-mes="${paso}"]:not(:disabled)`);
      (siguiente ?? panel.querySelector("[data-mes='1']")).focus();
      return;
    }
    campo.value = control.dataset.fecha;
    campo.dispatchEvent(new Event("change"));
    panel.hidePopover();
    boton.focus();
  });
}
