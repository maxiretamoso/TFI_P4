import { api } from "../api.js";
import { actualizarUsuarioGuardado } from "../session.js";
import { NOMBRES_ROL, esc, cargando, mensajeError, urlDelAvatar, avatarHtml } from "../ui.js";

const TAMANIO_MAXIMO = 2 * 1024 * 1024;
const TIPOS_PERMITIDOS = ["image/jpeg", "image/png", "image/webp"];

let contenedor = null;
let perfil = null;
let predefinidos = [];
let archivoElegido = null;

const ICONO_SUBIR = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 16V4m0 0-4.5 4.5M12 4l4.5 4.5M4 16v2.5A1.5 1.5 0 0 0 5.5 20h13a1.5 1.5 0 0 0 1.5-1.5V16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const ICONO_CANDADO = `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="10.5" width="14" height="10" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" fill="none" stroke="currentColor" stroke-width="2"/></svg>`;
const ICONO_OJO = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="2"/></svg>`;

function campoContrasenia(id, etiqueta, autocompletar) {
  return `<div class="mb-3">
    <label class="form-label" for="${id}">${etiqueta}</label>
    <div class="campo-con-boton">
      <input class="form-control" type="password" id="${id}" autocomplete="${autocompletar}" maxlength="100" required>
      <button type="button" class="boton-ver" data-ver="${id}" aria-label="Mostrar ${etiqueta.toLowerCase()}" aria-pressed="false">${ICONO_OJO}</button>
    </div>
  </div>`;
}

function fotoAmpliable() {
  const url = urlDelAvatar(perfil.avatar);
  if (!url) return avatarHtml(perfil, "perfil-avatar");
  return `<button type="button" class="boton-ampliar" data-bs-toggle="modal" data-bs-target="#modal-foto" aria-label="Ampliar la foto de perfil">
    ${avatarHtml(perfil, "perfil-avatar")}
    <span class="lupa" aria-hidden="true">⤢</span>
  </button>`;
}

export async function pintar(zona) {
  contenedor = zona;
  archivoElegido = null;
  contenedor.innerHTML = `<div class="tarjeta-lista">${cargando("Cargando perfil...")}</div>`;

  try {
    [perfil, predefinidos] = await Promise.all([api.get("/me"), api.get("/avatares")]);
  } catch (e) {
    contenedor.innerHTML = `<div class="tarjeta-lista">${mensajeError(e.message)}</div>`;
    return;
  }

  contenedor.innerHTML = `
    <section class="perfil-cabecera">
      <div class="perfil-portada"></div>
      <div class="perfil-identidad">
        <div class="zona-vista-avatar">${fotoAmpliable()}</div>
        <div class="perfil-nombre">
          <h2>${esc(perfil.nombres)} ${esc(perfil.apellidos)}</h2>
          <span class="etiqueta-rol">${esc(NOMBRES_ROL[perfil.rol] ?? perfil.rol)}</span>
        </div>
      </div>
      <dl class="perfil-detalles">
        <div><dt>Usuario</dt><dd>${esc(perfil.usuario)}</dd></div>
        <div><dt>Área</dt><dd>${esc(perfil.area)}</dd></div>
      </dl>
    </section>

    <div class="grilla-perfil">
      <section class="tarjeta-perfil">
        <h3>Elegí un avatar</h3>
        <p class="texto-ayuda">Tocá uno para usarlo como foto de perfil.</p>
        <div class="grilla-avatares" role="group" aria-label="Avatares disponibles">${botonesDeAvatares()}</div>
        <div class="zona-predefinido"></div>
      </section>

      <section class="tarjeta-perfil">
        <h3>Subí una foto propia</h3>
        <form id="form-avatar" novalidate>
          <label class="zona-carga" for="campo-avatar">
            <input type="file" id="campo-avatar" accept="${TIPOS_PERMITIDOS.join(",")}" class="visually-hidden">
            <span class="zona-carga-vacia">
              <span class="icono-grande">${ICONO_SUBIR}</span>
              <strong>Arrastrá una imagen o hacé clic</strong>
              <span class="texto-ayuda">JPG, PNG o WEBP, hasta 2 MB</span>
            </span>
            <span class="zona-carga-vista" hidden>
              <img alt="Vista previa de la foto elegida">
              <span class="nombre-archivo"></span>
            </span>
          </label>
          <div class="zona-avatar"></div>
          <button class="btn btn-gim w-100 mt-2" type="submit" id="boton-avatar" disabled>Subir foto</button>
        </form>
      </section>

      <section class="tarjeta-perfil tarjeta-contrasenia">
        <h3><span class="icono-titulo">${ICONO_CANDADO}</span>Cambiar la contraseña</h3>
        <form id="form-contrasenia" novalidate>
          ${campoContrasenia("campo-actual", "Contraseña actual", "current-password")}
          ${campoContrasenia("campo-nueva", "Contraseña nueva", "new-password")}
          ${campoContrasenia("campo-repetir", "Repetí la contraseña nueva", "new-password")}
          <p class="texto-ayuda">Tiene que tener al menos 6 caracteres.</p>
          <div class="zona-contrasenia"></div>
          <button class="btn btn-gim w-100" type="submit" id="boton-contrasenia">Guardar contraseña</button>
        </form>
      </section>
    </div>

    <div class="modal fade" id="modal-foto" tabindex="-1" aria-label="Foto de perfil ampliada" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content modal-foto">
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button>
          <img class="foto-ampliada" src="${urlDelAvatar(perfil.avatar)}" alt="Foto de perfil de ${esc(perfil.nombres)} ${esc(perfil.apellidos)}">
        </div>
      </div>
    </div>`;

  contenedor.querySelector(".grilla-avatares").addEventListener("click", elegirPredefinido);
  contenedor.querySelector("#form-avatar").addEventListener("submit", subirAvatar);
  contenedor.querySelector("#campo-avatar").addEventListener("change", (e) => prepararArchivo(e.target.files[0]));
  contenedor.querySelector("#form-contrasenia").addEventListener("submit", cambiarContrasenia);
  contenedor.querySelector("#form-contrasenia").addEventListener("click", alternarVisibilidad);
  activarArrastre(contenedor.querySelector(".zona-carga"));
}

function botonesDeAvatares() {
  return predefinidos
    .map((p, i) => {
      const elegido = p.avatar === perfil.avatar;
      return `<button type="button" class="opcion-avatar${elegido ? " elegido" : ""}" data-predefinido="${esc(p.id)}"
        aria-pressed="${elegido}" aria-label="Avatar ${i + 1}">
        <img src="${urlDelAvatar(p.avatar)}" alt="">
      </button>`;
    })
    .join("");
}

function mostrarAvatar(archivo) {
  perfil.avatar = archivo;
  actualizarUsuarioGuardado({ avatar: archivo });
  contenedor.querySelector(".zona-vista-avatar").innerHTML = fotoAmpliable();
  contenedor.querySelector(".foto-ampliada").src = urlDelAvatar(archivo);
  contenedor.querySelector(".grilla-avatares").innerHTML = botonesDeAvatares();
  const enLaBarra = document.querySelector(".barra-superior .avatar");
  if (enLaBarra) enLaBarra.outerHTML = avatarHtml(perfil, "avatar-barra");
}

function avisar(selector, texto, esError) {
  contenedor.querySelector(selector).innerHTML = esError
    ? mensajeError(texto)
    : `<p class="mensaje-ok" role="status">${esc(texto)}</p>`;
}

async function elegirPredefinido(evento) {
  const boton = evento.target.closest("button[data-predefinido]");
  if (!boton || boton.classList.contains("elegido")) return;

  contenedor.querySelectorAll(".opcion-avatar").forEach((b) => (b.disabled = true));
  try {
    const actualizado = await api.patch(`/usuarios/${perfil.id_usuario}/avatar`, {
      predefinido: boton.dataset.predefinido,
    });
    mostrarAvatar(actualizado.avatar);
    avisar(".zona-predefinido", "Avatar actualizado.", false);
  } catch (e) {
    contenedor.querySelectorAll(".opcion-avatar").forEach((b) => (b.disabled = false));
    avisar(".zona-predefinido", e.message, true);
  }
}

function activarArrastre(zona) {
  ["dragenter", "dragover"].forEach((tipo) =>
    zona.addEventListener(tipo, (e) => {
      e.preventDefault();
      zona.classList.add("arrastrando");
    })
  );
  ["dragleave", "drop"].forEach((tipo) =>
    zona.addEventListener(tipo, () => zona.classList.remove("arrastrando"))
  );
  zona.addEventListener("drop", (e) => {
    e.preventDefault();
    prepararArchivo(e.dataTransfer.files[0]);
  });
}

function prepararArchivo(archivo) {
  const boton = contenedor.querySelector("#boton-avatar");
  const vacia = contenedor.querySelector(".zona-carga-vacia");
  const vista = contenedor.querySelector(".zona-carga-vista");
  contenedor.querySelector(".zona-avatar").innerHTML = "";

  if (!archivo) return;
  if (!TIPOS_PERMITIDOS.includes(archivo.type)) {
    avisar(".zona-avatar", "Elegí una imagen JPG, PNG o WEBP.", true);
    return;
  }
  if (archivo.size > TAMANIO_MAXIMO) {
    avisar(".zona-avatar", "La imagen supera los 2 MB.", true);
    return;
  }

  archivoElegido = archivo;
  vista.querySelector("img").src = URL.createObjectURL(archivo);
  vista.querySelector(".nombre-archivo").textContent = archivo.name;
  vacia.hidden = true;
  vista.hidden = false;
  boton.disabled = false;
}

async function subirAvatar(evento) {
  evento.preventDefault();
  if (!archivoElegido) return;

  const datos = new FormData();
  datos.append("avatar", archivoElegido);

  const boton = contenedor.querySelector("#boton-avatar");
  boton.disabled = true;
  boton.innerHTML = `<span class="spinner-border spinner-border-sm" aria-hidden="true"></span> Subiendo...`;
  try {
    const actualizado = await api.patch(`/usuarios/${perfil.id_usuario}/avatar`, datos);
    mostrarAvatar(actualizado.avatar);
    archivoElegido = null;
    contenedor.querySelector("#campo-avatar").value = "";
    contenedor.querySelector(".zona-carga-vacia").hidden = false;
    contenedor.querySelector(".zona-carga-vista").hidden = true;
    avisar(".zona-avatar", "Foto actualizada.", false);
    boton.textContent = "Subir foto";
  } catch (e) {
    avisar(".zona-avatar", e.message, true);
    boton.disabled = false;
    boton.textContent = "Subir foto";
  }
}

function alternarVisibilidad(evento) {
  const boton = evento.target.closest("button[data-ver]");
  if (!boton) return;
  const campo = contenedor.querySelector(`#${boton.dataset.ver}`);
  const mostrar = campo.type === "password";
  campo.type = mostrar ? "text" : "password";
  boton.setAttribute("aria-pressed", String(mostrar));
}

async function cambiarContrasenia(evento) {
  evento.preventDefault();

  const actual = contenedor.querySelector("#campo-actual");
  const nueva = contenedor.querySelector("#campo-nueva");
  const repetir = contenedor.querySelector("#campo-repetir");

  if (!actual.value || !nueva.value) {
    avisar(".zona-contrasenia", "Completá la contraseña actual y la nueva.", true);
    return;
  }
  if (nueva.value.length < 6) {
    avisar(".zona-contrasenia", "La contraseña nueva tiene que tener al menos 6 caracteres.", true);
    return;
  }
  if (nueva.value !== repetir.value) {
    avisar(".zona-contrasenia", "Las contraseñas nuevas no coinciden.", true);
    return;
  }

  const boton = contenedor.querySelector("#boton-contrasenia");
  boton.disabled = true;
  try {
    await api.patch("/auth/contrasenia", {
      contrasenia_actual: actual.value,
      contrasenia_nueva: nueva.value,
    });
    [actual, nueva, repetir].forEach((campo) => (campo.value = ""));
    avisar(".zona-contrasenia", "Contraseña actualizada.", false);
  } catch (e) {
    avisar(".zona-contrasenia", e.message, true);
  } finally {
    boton.disabled = false;
  }
}
