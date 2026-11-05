const nodemailer = require("nodemailer");
const usuariosDatos = require("../datos/usuarios.datos");
const { armarCorreoDeCierre } = require("../utils/correoIncidencia");

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

async function enviarNotificacionDeIncidencia({ incidencia, estado, resolucion }) {
  try {
    const creador = await usuariosDatos.buscarPorId(incidencia.creado_por);
    const destinatario = process.env.MAIL_TO_TEST || (creador && creador.usuario);
    if (!destinatario) return false;

    const { asunto, html, adjuntos } = armarCorreoDeCierre({ incidencia, estado, resolucion });
    const mensaje = {
      from: process.env.MAIL_FROM || process.env.MAIL_USER || "no-reply@incidencias.local",
      to: destinatario,
      subject: asunto,
      html,
      attachments: adjuntos,
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
