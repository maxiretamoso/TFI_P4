const path = require("path");
const PDFDocument = require("pdfkit");
const { ESTADOS } = require("../config/estados");

const LOGO = path.join(__dirname, "..", "assets", "logo-muni.png");

const COLOR = {
  verde: "#5e8c3a",
  verdeOscuro: "#3d6326",
  verdeSuave: "#e8efe1",
  texto: "#26261f",
  textoSuave: "#6b6f63",
  borde: "#d6d7cc",
  fila: "#f6f6f0",
};

const COLOR_ESTADO = {
  [ESTADOS.PENDIENTE]: "#d98e04",
  [ESTADOS.EN_PROCESO]: "#3a7bd5",
  [ESTADOS.RESUELTA]: "#5e8c3a",
  [ESTADOS.CANCELADA]: "#d64541",
};

const PRIORIDADES = { 1: "Baja", 2: "Media", 3: "Alta" };
const MARGEN = 45;
const ALTO_FILA = 22;

function porcentaje(parte, total) {
  return total > 0 ? Math.round((parte / total) * 100) : 0;
}

function anchoUtil(doc) {
  return doc.page.width - MARGEN * 2;
}

function encabezado(doc) {
  const ancho = doc.page.width;
  doc.rect(0, 0, ancho, 96).fill(COLOR.verde);
  doc.image(LOGO, MARGEN, 26, { height: 44 });

  doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(20)
    .text("Reporte de incidencias", 0, 30, { width: ancho - MARGEN, align: "right" });
  doc.font("Helvetica").fontSize(9.5)
    .text("Gestión de Incidencias Municipales", 0, 56, { width: ancho - MARGEN, align: "right" })
    .text(`Generado el ${new Date().toLocaleString("es-AR")}`, 0, 70, { width: ancho - MARGEN, align: "right" });

  doc.y = 122;
}

function titulo(doc, texto) {
  asegurarEspacio(doc, 60);
  doc.moveDown(0.6);
  const y = doc.y;
  doc.rect(MARGEN, y + 2, 4, 14).fill(COLOR.verde);
  doc.fillColor(COLOR.texto).font("Helvetica-Bold").fontSize(13).text(texto, MARGEN + 12, y);
  doc.moveDown(0.5);
}

function asegurarEspacio(doc, alto) {
  if (doc.y + alto > doc.page.height - MARGEN - 20) {
    doc.addPage();
    doc.y = MARGEN;
  }
}

function tarjetas(doc, datos) {
  const separacion = 10;
  const ancho = (anchoUtil(doc) - separacion * (datos.length - 1)) / datos.length;
  const y = doc.y;

  datos.forEach(({ etiqueta, valor, color }, i) => {
    const x = MARGEN + i * (ancho + separacion);
    doc.roundedRect(x, y, ancho, 58, 6).fillAndStroke("#ffffff", COLOR.borde);
    doc.rect(x, y + 6, 4, 46).fill(color);
    doc.fillColor(color).font("Helvetica-Bold").fontSize(20).text(String(valor), x + 14, y + 10, { width: ancho - 20 });
    doc.fillColor(COLOR.textoSuave).font("Helvetica").fontSize(9).text(etiqueta, x + 14, y + 37, { width: ancho - 20 });
  });

  doc.y = y + 70;
  doc.x = MARGEN;
}

// Dibuja una tabla con encabezado verde y filas alternadas; si no entra, sigue en otra página
// repitiendo el encabezado. Cada columna puede dibujar su celda a mano con "dibujar".
function tabla(doc, columnas, filas) {
  const anchoTotal = anchoUtil(doc);
  const anchos = columnas.map((c) => c.ancho * anchoTotal);

  const dibujarEncabezado = () => {
    const y = doc.y;
    doc.rect(MARGEN, y, anchoTotal, ALTO_FILA).fill(COLOR.verdeSuave);
    let x = MARGEN;
    columnas.forEach((c, i) => {
      doc.fillColor(COLOR.verdeOscuro).font("Helvetica-Bold").fontSize(9)
        .text(c.titulo, x + 6, y + 7, { width: anchos[i] - 12, align: c.alinear ?? "left", height: 11, ellipsis: true });
      x += anchos[i];
    });
    doc.y = y + ALTO_FILA;
  };

  dibujarEncabezado();

  if (filas.length === 0) {
    doc.fillColor(COLOR.textoSuave).font("Helvetica").fontSize(9).text("Sin datos.", MARGEN + 6, doc.y + 7);
    doc.y += ALTO_FILA;
    return;
  }

  filas.forEach((fila, indice) => {
    if (doc.y + ALTO_FILA > doc.page.height - MARGEN - 20) {
      doc.addPage();
      doc.y = MARGEN;
      dibujarEncabezado();
    }
    const y = doc.y;
    if (indice % 2 === 1) doc.rect(MARGEN, y, anchoTotal, ALTO_FILA).fill(COLOR.fila);
    doc.moveTo(MARGEN, y + ALTO_FILA).lineTo(MARGEN + anchoTotal, y + ALTO_FILA).lineWidth(0.5).stroke(COLOR.borde);

    let x = MARGEN;
    columnas.forEach((c, i) => {
      if (c.dibujar) {
        c.dibujar(doc, fila, x, y, anchos[i]);
      } else {
        doc.fillColor(COLOR.texto).font("Helvetica").fontSize(9)
          .text(String(fila[c.campo] ?? ""), x + 6, y + 7, {
            width: anchos[i] - 12,
            align: c.alinear ?? "left",
            height: 11,
            ellipsis: true,
          });
      }
      x += anchos[i];
    });
    doc.y = y + ALTO_FILA;
  });
  doc.x = MARGEN;
}

function celdaConPunto(color, texto) {
  return (doc, fila, x, y, ancho) => {
    doc.circle(x + 11, y + ALTO_FILA / 2, 3.5).fill(color(fila));
    doc.fillColor(COLOR.texto).font("Helvetica").fontSize(9)
      .text(texto(fila), x + 20, y + 7, { width: ancho - 26, height: 11, ellipsis: true });
  };
}

function celdaConBarra(total, color) {
  return (doc, fila, x, y, ancho) => {
    const largo = ancho - 16;
    doc.roundedRect(x + 8, y + 8, largo, 6, 3).fill("#ececE4");
    const relleno = total > 0 ? (fila.total / total) * largo : 0;
    if (relleno > 0) doc.roundedRect(x + 8, y + 8, Math.max(relleno, 6), 6, 3).fill(color(fila));
  };
}

function tablaDeTotales(doc, nombreColumna, filas, total, color) {
  tabla(
    doc,
    [
      { titulo: nombreColumna, ancho: 0.38, dibujar: celdaConPunto(color, (f) => f.nombre) },
      { titulo: "Cantidad", ancho: 0.14, campo: "total", alinear: "right" },
      { titulo: "%", ancho: 0.12, campo: "porcentaje", alinear: "right" },
      { titulo: "", ancho: 0.36, dibujar: celdaConBarra(total, color) },
    ],
    filas.map((f) => ({ ...f, porcentaje: `${porcentaje(f.total, total)}%` }))
  );
}

function pieDePagina(doc) {
  const rango = doc.bufferedPageRange();
  for (let i = rango.start; i < rango.start + rango.count; i++) {
    doc.switchToPage(i);
    // Sin margen inferior, para que el pie no fuerce una página nueva.
    doc.page.margins.bottom = 0;
    const y = doc.page.height - MARGEN + 10;
    doc.moveTo(MARGEN, y - 6).lineTo(doc.page.width - MARGEN, y - 6).lineWidth(0.5).stroke(COLOR.borde);
    doc.fillColor(COLOR.textoSuave).font("Helvetica").fontSize(8)
      .text("Municipalidad de Concordia · Área de Sistemas", MARGEN, y, { lineBreak: false });
    doc
      .text(`Página ${i + 1} de ${rango.count}`, MARGEN, y, {
        width: anchoUtil(doc),
        align: "right",
        lineBreak: false,
      });
  }
}

function crearReporteIncidencias({ porEstado, porPrioridad, porArea, detalle }) {
  const doc = new PDFDocument({ margin: MARGEN, size: "A4", bufferPages: true });
  const total = detalle.length;
  const contar = (id) => porEstado.find((f) => f.id_estado === id)?.total ?? 0;

  encabezado(doc);

  tarjetas(doc, [
    { etiqueta: "Total", valor: total, color: COLOR.verdeOscuro },
    { etiqueta: "Pendientes", valor: contar(ESTADOS.PENDIENTE), color: COLOR_ESTADO[ESTADOS.PENDIENTE] },
    { etiqueta: "En proceso", valor: contar(ESTADOS.EN_PROCESO), color: COLOR_ESTADO[ESTADOS.EN_PROCESO] },
    { etiqueta: "Resueltas", valor: contar(ESTADOS.RESUELTA), color: COLOR_ESTADO[ESTADOS.RESUELTA] },
    { etiqueta: "Canceladas", valor: contar(ESTADOS.CANCELADA), color: COLOR_ESTADO[ESTADOS.CANCELADA] },
  ]);

  titulo(doc, "Totales por estado");
  tablaDeTotales(
    doc,
    "Estado",
    porEstado.map((f) => ({ nombre: f.estado, total: f.total, id_estado: f.id_estado })),
    total,
    (f) => COLOR_ESTADO[f.id_estado] ?? COLOR.verde
  );

  titulo(doc, "Totales por prioridad");
  const porId = new Map(porPrioridad.map((f) => [f.prioridad, f.total]));
  tablaDeTotales(
    doc,
    "Prioridad",
    [3, 2, 1].map((p) => ({ nombre: PRIORIDADES[p], total: porId.get(p) ?? 0 })),
    total,
    () => COLOR.verde
  );

  titulo(doc, "Totales por área del artículo");
  tablaDeTotales(doc, "Área", porArea.map((f) => ({ nombre: f.area, total: f.total })), total, () => COLOR.verde);

  titulo(doc, "Detalle de incidencias");
  tabla(
    doc,
    [
      { titulo: "#", ancho: 0.05, campo: "id_incidencia" },
      { titulo: "Fecha", ancho: 0.11, campo: "fecha" },
      { titulo: "Artículo", ancho: 0.16, campo: "articulo" },
      { titulo: "Pedido", ancho: 0.24, campo: "descripcion_pedido" },
      { titulo: "Prioridad", ancho: 0.11, campo: "prioridad_texto" },
      {
        titulo: "Estado",
        ancho: 0.14,
        dibujar: celdaConPunto((f) => COLOR_ESTADO[f.id_estado] ?? COLOR.verde, (f) => f.estado),
      },
      { titulo: "Asignada a", ancho: 0.19, campo: "asignado" },
    ],
    detalle.map((inc) => ({
      ...inc,
      fecha: new Date(inc.creado).toLocaleDateString("es-AR"),
      prioridad_texto: PRIORIDADES[inc.prioridad] ?? inc.prioridad,
      asignado: `${inc.asignado_nombres} ${inc.asignado_apellidos}`,
    }))
  );

  pieDePagina(doc);
  return doc;
}

module.exports = { crearReporteIncidencias };
