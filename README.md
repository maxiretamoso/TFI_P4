# TFI Programación IV – API de Incidencias (UNER)

Backend REST en **Node.js + Express + PostgreSQL** con autenticación JWT, roles y reportes en PDF.

## Instalación desde cero

```bash
git clone https://github.com/maxiretamoso/TFI_P4.git
cd TFI_P4/server
npm install
```

## Variables de entorno

El archivo real `server/.env` no se sube al repo (está en `.gitignore`). Usá `server/.env.example` como plantilla:

```bash
cp server/.env.example server/.env
# editar server/.env con tus valores reales
```

Variables necesarias (`ver server/.env.example`):
- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
- `PORT`, `JWT_SECRET`
- `MAIL_HOST`, `MAIL_PORT`, `MAIL_USER`, `MAIL_PASS`, `MAIL_FROM`, `MAIL_TO_TEST` (si están vacías, el email se simula en consola y no falla)

## Base de datos

El dump está en `database/TFI_Prog4.sql` (tablas, secuencias y datos seed).

```bash
# Crear BD (ejemplo con psql)
createdb TFI_Prog4
psql -U postgres -d TFI_Prog4 -f database/TFI_Prog4.sql

# O restaurar desde pgAdmin importando el SQL
```

Usuarios seed (contraseña migra automáticamente de sha256 a bcrypt en el primer login):
- `cibarra` / `Usuario.1` — Empleado municipal (rol 1)
- `mlopez` / `Usuario.2` — Empleado de Sistemas (rol 2)
- `raguirre` / `Usuario.3` — Director (rol 3)

## Levantar el proyecto

```bash
cd server
npm start        # producción: node index.js
npm run dev      # desarrollo con --watch
# Servidor en http://localhost:3000 (o PORT del .env)
# Docs Swagger en http://localhost:3000/api-docs
```

## Documentación API

- **Swagger UI**: `http://localhost:3000/api-docs`
- **Swagger JSON**: `http://localhost:3000/api-docs.json`
- Versionado: todas las rutas bajo `/api/v1/...` (se mantiene compatibilidad `/api/...`)

## Roles y permisos

- **Empleado municipal (rol 1)**: listar artículos, `POST /incidencias` (crear), `GET /incidencias` (solo propias `creado_por`), `PATCH /incidencias/:id/cancelar` solo si `PENDIENTE` y propia.
- **Empleado de Sistemas (rol 2)**: `GET /incidencias` (solo `asignado_a`), `PATCH /incidencias/:id/finalizar` (requiere `descripcion_resolucion`), BREAD de categorías/artículos (con `activo` soft delete).
- **Director (rol 3)**: ve todas las incidencias, `PATCH /incidencias/:id/asignar`, `PATCH /cancelar` cualquiera `PENDIENTE`, `GET /dashboard` y `GET /reportes/incidencias` (PDF, requiere rol 3), BREAD completo y gestión de usuarios.

## Endpoints principales

- `POST /api/v1/auth/login` — JWT con `id_usuario` y `rol`
- `GET /api/v1/incidencias` — filtrado automático por rol (`/mias`, `/asignadas`, `/todas` como atajos)
- `PATCH /api/v1/incidencias/:id/cancelar|finalizar|asignar`
- `GET /api/v1/dashboard` — totales por estado/fecha, prioritarias
- `GET /api/v1/reportes/incidencias` — PDF (pdfkit)
- BREAD `categorias`, `articulos`, `areas`, `estados`, `usuarios` (soft delete `activo=0`)
- `POST /api/v1/usuarios/:id/avatar` — multer (imagen, 2MB, guarda en `server/uploads/avatars/`)

## Flujo E2E verificado

Login → crear incidencia → asignar (director) → finalizar (sistemas) → cancelar (municipal/director) → dashboard/PDF → Swagger. Email se envía vía nodemailer al `creado_por` en finalizar/cancelar (si `MAIL_*` no configurado, se loguea simulado sin error).
