const nodemailer = require("nodemailer");

function crearTransporter() {
  // Usa variables de entorno, sin hardcodear. Si no están, usa ethereal/test fallback que no envía real.
  const host = process.env.MAIL_HOST;
  const port = process.env.MAIL_PORT ? parseInt(process.env.MAIL_PORT, 10) : 587;
  const user = process.env.MAIL_USER;
  const pass = process.env.MAIL_PASS;

  if (!host || !user || !pass) {
    console.warn("MAIL_* no configurado: usando transporter de prueba (no envía email real)");
    return nodemailer.createTransport({
      streamTransport: true,
      newline: "unix",
      buffer: true,
    });
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

async function enviarMail({ to, subject, text, html }) {
  const transporter = crearTransporter();
  const from = process.env.MAIL_FROM || process.env.MAIL_USER || "no-reply@incidencias.local";
  const info = await transporter.sendMail({ from, to, subject, text, html });
  // Si es streamTransport, loguea el contenido
  if (info.message) {
    console.log("Email (simulado):", info.message.toString().slice(0, 2000));
  } else {
    console.log("Email enviado:", info.messageId);
  }
  return info;
}

module.exports = { enviarMail, crearTransporter };
