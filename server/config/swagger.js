import swaggerJsdoc from "swagger-jsdoc";

const PREFIJO_API = "/api/v1";

const definicion = {
  openapi: "3.0.0",
  info: {
    title: "API de Gestión de Incidencias",
    version: "1.0.0",
    description:
      "Trabajo Final Integrador — Programación IV. " +
      "Roles: 1 Director del área de Sistemas, 2 Empleado del área de Sistemas, 3 Empleado Municipal.",
  },
  servers: [{ url: `http://localhost:${process.env.PORT || 3000}${PREFIJO_API}` }],
  components: {
    securitySchemes: {
      bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
    },
    schemas: {
      Error: {
        type: "object",
        properties: { error: { type: "string" } },
      },
      Usuario: {
        type: "object",
        properties: {
          id_usuario: { type: "integer" },
          id_area: { type: "integer" },
          nombres: { type: "string" },
          apellidos: { type: "string" },
          usuario: { type: "string", format: "email" },
          avatar: { type: "string" },
          rol: { type: "integer", enum: [1, 2, 3] },
          activo: { type: "integer", enum: [0, 1] },
        },
      },
      Articulo: {
        type: "object",
        properties: {
          id_articulo: { type: "integer" },
          id_area: { type: "integer" },
          id_categoria: { type: "integer" },
          descripcion: { type: "string" },
          area: { type: "string" },
          categoria: { type: "string" },
          activo: { type: "integer", enum: [0, 1] },
        },
      },
      Incidencia: {
        type: "object",
        properties: {
          id_incidencia: { type: "integer" },
          id_articulo: { type: "integer" },
          id_estado: { type: "integer" },
          estado: { type: "string" },
          creado_por: { type: "integer" },
          asignado_a: { type: "integer" },
          creado: { type: "string", format: "date-time" },
          prioridad: { type: "integer", enum: [1, 2, 3] },
          descripcion_pedido: { type: "string" },
          descripcion_resolucion: { type: "string", nullable: true },
          fecha_estado: {
            type: "string",
            format: "date-time",
            nullable: true,
            description: "Fecha y hora en que pasó al estado actual (en una resuelta o cancelada, la fecha de cierre)",
          },
        },
      },
    },
    responses: {
      DatosInvalidos: {
        description: "Los datos enviados no pasaron la validación",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: { errors: { type: "array", items: { type: "object" } } },
            },
          },
        },
      },
      NoAutenticado: {
        description: "Falta el token o no es válido",
        content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
      },
      SinPermiso: {
        description: "El rol del usuario no habilita esta operación",
        content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
      },
      NoEncontrado: {
        description: "El recurso no existe",
        content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
      },
    },
  },
  security: [{ bearerAuth: [] }],
};

const especificacion = swaggerJsdoc({
  definition: definicion,
  apis: [`${import.meta.dirname}/../routes/*.js`],
});

export { especificacion, PREFIJO_API };
