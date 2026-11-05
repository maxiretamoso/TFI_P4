const nodemailer = require("nodemailer");
const usuariosDatos = require("../datos/usuarios.datos");

// Estilos en línea porque los clientes de correo ignoran <style>.
const ESTILO_CAJA = "font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#222;max-width:560px";
const ESTILO_TITULO = "font-size:18px;margin:0 0 12px 0;color:#0d4d7a";
const ESTILO_DATO = "margin:4px 0";
const ESTILO_PIE = "margin-top:20px;font-size:12px;color:#777";

function hayCorreoConfigurado() {
  return Boolean(process.env.MAIL_HOST && process.env.MAIL_USER && process.env.MAIL_PASS);
}

function crearTransporte() {
  if (!hayCorreoConfigurado()) {
    return nodemailer.createTransport({ streamTransport: true, newline: "unix", buffer: true });
  }
  const port = Number(process.env.MAIL_PORT) || 587;
  return nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port,
    secure: port === 465,
    auth: { user: process.env.MAIL_USER, pass: process.env.MAIL_PASS },
  });
}

function armarCuerpo({ incidencia, estado, resolucion }) {
  const resuelta = estado === "finalizada";
  const filas = [
    `<p style="${ESTILO_DATO}"><b>Artículo:</b> ${incidencia.articulo_descripcion}</p>`,
    `<p style="${ESTILO_DATO}"><b>Pedido:</b> ${incidencia.descripcion_pedido}</p>`,
  ];
  if (resuelta && resolucion) {
    filas.push(`<p style="${ESTILO_DATO}"><b>Resolución:</b> ${resolucion}</p>`);
  }

  return `<div style="${ESTILO_CAJA}">
  <h1 style="${ESTILO_TITULO}">Incidencia #${incidencia.id_incidencia} ${estado}</h1>
  ${filas.join("\n  ")}
  <p style="${ESTILO_PIE}">Sistema de Registro de Incidencias — Área de Sistemas</p>
</div>`;
}

async function enviarNotificacionDeIncidencia({ incidencia, estado, resolucion }) {
  try {
    const creador = await usuariosDatos.buscarPorId(incidencia.creado_por);
    const destinatario = process.env.MAIL_TO_TEST || (creador && creador.usuario);
    if (!destinatario) return false;

    const mensaje = {
      from: process.env.MAIL_FROM || process.env.MAIL_USER || "no-reply@incidencias.local",
      to: destinatario,
      subject: `Incidencia #${incidencia.id_incidencia} ${estado}`,
      html: armarCuerpo({ incidencia, estado, resolucion }),
    };

    const envio = await crearTransporte().sendMail(mensaje);

    if (!hayCorreoConfigurado()) {
      console.log(`[correo simulado] para ${destinatario}: ${mensaje.subject}`);
    } else {
      console.log(`[correo enviado] ${envio.messageId}`);
    }
    return true;
  } catch (error) {
    // Un fallo de correo no debe tumbar la operación sobre la incidencia.
    console.error("No se pudo enviar la notificación:", error.message);
    return false;
  }
}

module.exports = { enviarNotificacionDeIncidencia };
