TFI Programación IV – Sistema de Registro de Incidencias (UNER)

Backend REST en Node.js + Express + PostgreSQL (Supabase), con autenticación JWT, roles de usuario, generación de reportes en PDF, envío de email y documentación Swagger.

Facultad de Ciencias de la Administración – UNER Programación IV – 2do Cuatrimestre 2026 – Licenciatura en Sistemas

Instalación desde cero
bash
git clone https://github.com/maxiretamoso/TFI_P4.git
cd TFI_P4/server
npm install
Variables de entorno

El archivo real server/.env no se sube al repo (está en .gitignore). Usá server/.env.example como plantilla:

bash
cp server/.env.example server/.env

# editar server/.env

Variables necesarias:

DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME → conexión a Supabase
PORT → puerto local del servidor (por defecto 3000)
JWT_SECRET → clave propia para firmar los tokens (no es de Supabase, la define cada uno igual para todo el equipo)
MAIL_HOST, MAIL_PORT, MAIL_USER, MAIL_PASS, MAIL_FROM, MAIL_TO_TEST → si quedan vacías, el email se simula en consola y no rompe nada
Base de datos

La base está alojada en Supabase (PostgreSQL en la nube, compartida por todo el equipo) — no hace falta instalar PostgreSQL local ni correr ningún script a mano.

El script real, provisto por la cátedra, está guardado en database/TFI_Prog4.sql como referencia (ya fue cargado una sola vez en el proyecto de Supabase compartido).

Para conectarte:

Pedile a Máximo el host, usuario y contraseña de Supabase (por privado, nunca por GitHub)
Completá tu server/.env con esos datos
Listo — ya estás conectado a la misma base que el resto del equipo
Usuarios de prueba (seed del profesor)

La contraseña de cada usuario son las 3 primeras letras del nombre + las 3 primeras del apellido, en minúscula:

Usuario Contraseña Rol
carper@correo.com carper Empleado de Sistemas (2)
cargom@correo.com cargom Empleado de Sistemas (2)
pamalm@correo.com pamalm Empleado Municipal (1)
estren@correo.com estren Director (3)

Las contraseñas se migran automáticamente de SHA-256 (formato original del profesor) a bcrypt en el primer login de cada usuario — no requiere ninguna acción manual.

Levantar el proyecto
bash
cd server
npm start # producción: node index.js
npm run dev # desarrollo con --watch (reinicia solo al guardar)

# Servidor en http://localhost:3000 (o el PORT que pusiste en .env)

# Docs Swagger en http://localhost:3000/api-docs

Documentación de la API
Swagger UI: http://localhost:3000/api-docs
Swagger JSON: http://localhost:3000/api-docs.json
Versionado: todas las rutas viven bajo /api/v1/... (se mantiene compatibilidad con /api/... sin versión)
Roles y permisos
Empleado Municipal (rol 1): listar artículos; POST /incidencias (crear); GET /incidencias (solo las propias, por creado_por); PATCH /incidencias/:id/cancelar (solo si está PENDIENTE y es propia).
Empleado de Sistemas (rol 2): GET /incidencias (solo las que tiene asignado_a); PATCH /incidencias/:id/finalizar (requiere descripcion_resolucion); BREAD de categorías/artículos (con soft delete vía activo).
Director (rol 3): ve todas las incidencias; PATCH /incidencias/:id/asignar; PATCH .../cancelar de cualquier incidencia PENDIENTE; GET /dashboard y GET /reportes/incidencias (PDF); BREAD completo y gestión de usuarios.
Endpoints principales
POST /api/v1/auth/login — devuelve JWT con id_usuario y rol
GET /api/v1/incidencias — filtrado automático según el rol logueado
PATCH /api/v1/incidencias/:id/cancelar · /finalizar · /asignar
GET /api/v1/dashboard — totales por estado, por fecha, incidencias prioritarias
GET /api/v1/reportes/incidencias — reporte en PDF
BREAD de categorias, articulos, areas, estados, usuarios (soft delete con activo = 0)
POST /api/v1/usuarios/:id/avatar — carga de imagen (máx. 2MB) vía Multer
Flujo end-to-end verificado

Login → crear incidencia → asignar (Director) → finalizar (Sistemas) → cancelar (Municipal o Director) → ver dashboard / generar PDF → todo documentado en Swagger. El email se envía automáticamente al creador de la incidencia al finalizarla o cancelarla (si MAIL\_\* no está configurado, se simula en consola sin romper nada).

Arquitectura del backend
server/
├── db/ → conexión a PostgreSQL (Supabase), con SSL habilitado
├── routes/ → un archivo por entidad, define los endpoints REST
├── middlewares/ → verificarToken (JWT) y verificarRol (permisos por rol)
├── utils/ → envío de email y validaciones reutilizables
└── index.js → arma el servidor y conecta todas las rutas
Notas técnicas importantes
La tabla incidencias.asignado_a es NOT NULL en el script del profesor. Al crear una incidencia nueva, se autoasigna temporalmente al mismo usuario que la creó, hasta que el Director la reasigne a un empleado de Sistemas real mediante PATCH /incidencias/:id/asignar.
La conexión a Supabase requiere SSL (ssl: { rejectUnauthorized: false } en db/index.js) — sin eso, la conexión falla aunque las credenciales sean correctas.
La extensión pgcrypto debe estar activa en la base (Supabase → SQL Editor → CREATE EXTENSION IF NOT EXISTS pgcrypto;), necesaria para la migración de contraseñas legacy.
