import { api } from "../api.js";
import { actualizarUsuarioGuardado } from "../auth/session.js";
import { NOMBRES_ROL, esc, cargando, mensajeError, urlDelAvatar, avatarHtml } from "../ui/ui.js";

const TAMANIO_MAXIMO = 2 * 1024 * 1024;
const TIPOS_PERMITIDOS = ["image/jpeg", "image/png", "image/webp"];

let contenedor = null;
let perfil = null;
let predefinidos = [];
// Lo que el usuario eligió en la ventana y todavía no guardó.
let pendiente = null;
let urlVistaPrevia = null;

function liberarVistaPrevia() {
  if (urlVistaPrevia) URL.revokeObjectURL(urlVistaPrevia);
  urlVistaPrevia = null;
}

window.addEventListener("hashchange", liberarVistaPrevia);

const ICONO_SUBIR = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 16V4m0 0-4.5 4.5M12 4l4.5 4.5M4 16v2.5A1.5 1.5 0 0 0 5.5 20h13a1.5 1.5 0 0 0 1.5-1.5V16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const ICONO_CANDADO = `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="10.5" width="14" height="10" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" fill="none" stroke="currentColor" stroke-width="2"/></svg>`;
const ICONO_OJO = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="2"/></svg>`;
const ICONO_CAMARA = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8.5A1.5 1.5 0 0 1 5.5 7h2l1.5-2h6l1.5 2h2A1.5 1.5 0 0 1 20 8.5v9a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 17.5z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><circle cx="12" cy="13" r="3.5" fill="none" stroke="currentColor" stroke-width="2"/></svg>`;

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

function ventanaCambiarFoto() {
  return `<div class="modal fade" id="modal-cambiar-foto" tabindex="-1" aria-labelledby="titulo-cambiar-foto" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered modal-lg">
      <div class="modal-content">
        <div class="modal-header">
          <h2 class="modal-title fs-5" id="titulo-cambiar-foto">Cambiar foto de perfil</h2>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button>
        </div>
        <div class="modal-body cambiar-foto">
          <div class="vista-previa">
            <div class="vista-previa-imagen"></div>
            <span class="texto-ayuda">Vista previa</span>
          </div>
          <div class="cambiar-foto-opciones">
            <ul class="nav nav-pills mb-3" role="tablist">
              <li class="nav-item" role="presentation">
                <button class="nav-link active" id="pestania-avatares" data-bs-toggle="pill" data-bs-target="#panel-avatares" type="button" role="tab" aria-controls="panel-avatares" aria-selected="true">Avatares</button>
              </li>
              <li class="nav-item" role="presentation">
                <button class="nav-link" id="pestania-foto" data-bs-toggle="pill" data-bs-target="#panel-foto" type="button" role="tab" aria-controls="panel-foto" aria-selected="false">Subir foto</button>
              </li>
            </ul>
            <div class="tab-content">
              <div class="tab-pane fade show active" id="panel-avatares" role="tabpanel" aria-labelledby="pestania-avatares">
                <div class="grilla-avatares" role="radiogroup" aria-label="Avatares disponibles">${botonesDeAvatares()}</div>
              </div>
              <div class="tab-pane fade" id="panel-foto" role="tabpanel" aria-labelledby="pestania-foto">
                <label class="zona-carga" for="campo-avatar">
                  <input type="file" id="campo-avatar" accept="${TIPOS_PERMITIDOS.join(",")}" class="visually-hidden">
                  <span class="icono-grande">${ICONO_SUBIR}</span>
                  <strong>Arrastrá una imagen o hacé clic</strong>
                  <span class="texto-ayuda">JPG, PNG o WEBP, hasta 2 MB</span>
                  <span class="nombre-archivo"></span>
                </label>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancelar</button>
          <button type="button" class="btn btn-gim" id="boton-guardar-foto" disabled>Guardar</button>
        </div>
      </div>
    </div>
  </div>`;
}

export async function pintar(zona) {
  contenedor = zona;
  pendiente = null;
  contenedor.innerHTML = `<div class="tarjeta-lista">${cargando("Cargando perfil...")}</div>`;

  try {
    [perfil, predefinidos] = await Promise.all([api.get("/me"), api.get("/avatares")]);
  } catch (e) {
    contenedor.innerHTML = `<div class="tarjeta-lista">${mensajeError(e.message, { fijo: true })}</div>`;
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
        <button type="button" class="btn btn-outline-secondary btn-sm boton-cambiar-foto" data-bs-toggle="modal" data-bs-target="#modal-cambiar-foto">
          <span class="icono-boton">${ICONO_CAMARA}</span> Cambiar foto
        </button>
      </div>
      <dl class="perfil-detalles">
        <div><dt>Usuario</dt><dd>${esc(perfil.usuario)}</dd></div>
        <div><dt>Área</dt><dd>${esc(perfil.area)}</dd></div>
      </dl>
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

    ${ventanaCambiarFoto()}

    <div class="modal fade" id="modal-foto" tabindex="-1" aria-label="Foto de perfil ampliada" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content modal-foto">
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button>
          <img class="foto-ampliada" src="${urlDelAvatar(perfil.avatar)}" alt="Foto de perfil de ${esc(perfil.nombres)} ${esc(perfil.apellidos)}">
          <button type="button" class="btn btn-gim boton-cambiar-desde-foto" data-bs-toggle="modal" data-bs-target="#modal-cambiar-foto">
            <span class="icono-boton">${ICONO_CAMARA}</span> Cambiar foto
          </button>
        </div>
      </div>
    </div>
    <div class="zona-aviso-foto"></div>`;

  const ventana = contenedor.querySelector("#modal-cambiar-foto");
  ventana.addEventListener("show.bs.modal", reiniciarVentana);
  ventana.addEventListener("hidden.bs.modal", () => {
    liberarVistaPrevia();
    pendiente = null;
    ventana.querySelector(".vista-previa-imagen").replaceChildren();
  });
  ventana.querySelector(".grilla-avatares").addEventListener("click", marcarPredefinido);
  ventana.querySelector("#campo-avatar").addEventListener("change", (e) => marcarArchivo(e.target.files[0]));
  ventana.querySelector("#boton-guardar-foto").addEventListener("click", guardarFoto);
  activarArrastre(ventana.querySelector(".zona-carga"));

  contenedor.querySelector("#form-contrasenia").addEventListener("submit", cambiarContrasenia);
  contenedor.querySelector("#form-contrasenia").addEventListener("click", alternarVisibilidad);
}

function botonesDeAvatares() {
  return predefinidos
    .map(
      (p, i) => `<button type="button" class="opcion-avatar" data-predefinido="${esc(p.id)}"
        role="radio" aria-checked="false" aria-label="Avatar ${i + 1}">
        <img src="${urlDelAvatar(p.avatar)}" alt="">
      </button>`
    )
    .join("");
}

function avisar(selector, texto, esError) {
  contenedor.querySelector(selector).innerHTML = esError
    ? mensajeError(texto)
    : `<p class="mensaje-ok" role="status">${esc(texto)}</p>`;
}

function mostrarVistaPrevia(url) {
  contenedor.querySelector(".vista-previa-imagen").innerHTML = url
    ? `<img class="avatar perfil-avatar" src="${url}" alt="">`
    : avatarHtml(perfil, "perfil-avatar");
}

function reiniciarVentana() {
  liberarVistaPrevia();
  pendiente = null;
  mostrarVistaPrevia(urlDelAvatar(perfil.avatar));
  contenedor.querySelectorAll(".opcion-avatar").forEach((b) => {
    const actual = urlDelAvatar(perfil.avatar) === b.querySelector("img").src;
    b.classList.toggle("elegido", actual);
    b.setAttribute("aria-checked", String(actual));
  });
  contenedor.querySelector("#campo-avatar").value = "";
  contenedor.querySelector(".nombre-archivo").textContent = "";
  contenedor.querySelector("#boton-guardar-foto").disabled = true;
}

function marcarPredefinido(evento) {
  const boton = evento.target.closest("button[data-predefinido]");
  if (!boton) return;

  contenedor.querySelectorAll(".opcion-avatar").forEach((b) => {
    b.classList.toggle("elegido", b === boton);
    b.setAttribute("aria-checked", String(b === boton));
  });
  liberarVistaPrevia();
  pendiente = { predefinido: boton.dataset.predefinido };
  mostrarVistaPrevia(boton.querySelector("img").src);
  contenedor.querySelector("#boton-guardar-foto").disabled = false;
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
    marcarArchivo(e.dataTransfer.files[0]);
  });
}

function marcarArchivo(archivo) {
  if (!archivo) return;
  if (!TIPOS_PERMITIDOS.includes(archivo.type)) {
    avisar(".zona-aviso-foto", "Elegí una imagen JPG, PNG o WEBP.", true);
    return;
  }
  if (archivo.size > TAMANIO_MAXIMO) {
    avisar(".zona-aviso-foto", "La imagen supera los 2 MB.", true);
    return;
  }

  contenedor.querySelectorAll(".opcion-avatar").forEach((b) => {
    b.classList.remove("elegido");
    b.setAttribute("aria-checked", "false");
  });
  pendiente = { archivo };
  contenedor.querySelector(".nombre-archivo").textContent = archivo.name;
  liberarVistaPrevia();
  urlVistaPrevia = URL.createObjectURL(archivo);
  mostrarVistaPrevia(urlVistaPrevia);
  contenedor.querySelector("#boton-guardar-foto").disabled = false;
}

async function guardarFoto() {
  if (!pendiente) return;

  let cuerpo = { predefinido: pendiente.predefinido };
  if (pendiente.archivo) {
    cuerpo = new FormData();
    cuerpo.append("avatar", pendiente.archivo);
  }

  const boton = contenedor.querySelector("#boton-guardar-foto");
  boton.disabled = true;
  boton.innerHTML = `<span class="spinner-border spinner-border-sm" aria-hidden="true"></span> Guardando...`;
  try {
    const actualizado = await api.patch(`/usuarios/${perfil.id_usuario}/avatar`, cuerpo);
    perfil.avatar = actualizado.avatar;
    actualizarUsuarioGuardado({ avatar: actualizado.avatar });
    contenedor.querySelector(".zona-vista-avatar").innerHTML = fotoAmpliable();
    contenedor.querySelector(".foto-ampliada").src = urlDelAvatar(actualizado.avatar);
    const enLaBarra = document.querySelector(".barra-superior .avatar");
    if (enLaBarra) enLaBarra.outerHTML = avatarHtml(perfil, "avatar-barra");

    contenedor.querySelector('#modal-cambiar-foto [data-bs-dismiss="modal"]').click();
    avisar(".zona-aviso-foto", "Foto de perfil actualizada.", false);
  } catch (e) {
    avisar(".zona-aviso-foto", e.message, true);
    boton.disabled = false;
  } finally {
    boton.textContent = "Guardar";
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
