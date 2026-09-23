# NOTAS_CORRECCION — convergencia post-refactor (5 puntos)

Fecha: 2026-09-23. Estado verificado en código, no asumido.

## 1. Colisión `server/utils/httpError.js` — RESUELTO
En disco sobrevivía la factory del agente 2 (`crearError(status, msg)`), usada en
`incidencias.service.js` (~17 throws) y `articulos.service.js` (3 throws).
Mis `services/auth.service.js` (5 throws) y `services/usuarios.service.js` (1 throw)
importaban la clase `HttpError` inexistente → `ReferenceError` en rutas de error.
Convención definitiva: **factory `crearError`** (rompía menos archivos).
Convertidos los 6 `throw new HttpError(s, m)` a `throw crearError(s, m)`.
Verificado: `node --check` OK, cero `new HttpError` restantes, factory probada en `node -e`.

## 2. Seguridad: `GET /usuarios` sin token — RESUELTO
`server/routes/usuarios.js`: `GET /` y `GET /:id` eran públicos (heredado del original).
Comparativa: `areas/categorias/estados/articulos` también tienen `GET` públicos, pero
exponen solo descripciones; usuarios expone nómina (nombres, apellidos, usuario, rol, área).
Fix aplicado: `verificarToken` en ambos `GET` (sin `verificarRol` para no romper flujos
municipal/sistemas; POST/DELETE ya eran rol 3, PUT valida director-o-propio en el service).
Verificado: sin token → 401; con JWT rol 1 → pasa auth y llega al service.
Hueco documentado, middleware agregado exactamente ahí.

## 3. Convergencia de estilo — RESUELTO
- Avatar: `auth.service.js` usaba `avatar || ""`, unificado a `avatar || null`
  como en `usuarios.service.js`. Cero `|| ""` restantes.
- Huérfanos: `subirAvatar` no borraba el archivo nuevo en 404 y dejaba el avatar
  anterior huérfano. Ahora borra el nuevo en 403/404/`catch` y el anterior tras
  reemplazo exitoso (solo bajo `uploads/avatars/`, best-effort sin romper el request).
  El soft delete conserva el avatar a propósito (reactivable, sin huérfano).
- Validación: ya convergida — cero `validationResult` en `routes/`; los 7 controllers
  con validadores usan `responderSiHayErroresDeValidacion`. Sin cambios necesarios.

## 4. Dependencias y config — RESUELTO
- `@supabase/server` eliminado de `package.json` (cero usos en código, re-verificado)
  vía `npm uninstall` → `package-lock.json` también limpio.
- `server/.env.example` recreado con 14/14 vars del README (DB_*×5, PORT, JWT_SECRET,
  MAIL_*×7) y valores de ejemplo. `cp .env.example .env` vuelve a funcionar.

## 5. Verificación final — PARCIAL (sin DB real)
Servidor arranca OK. Matriz: `GET /` 200; `POST login {}` 400; sin token → 401 en
`me`, `usuarios`, `usuarios/1`, `areas(POST)`, `incidencias`, `reportes`; JWT rol 1
en `POST /areas` → 403 exacto; 404 genérico OK; `node --check` 40/40 archivos.
**NO verificado por falta de acceso a Supabase** (`ENOTFOUND`): login válido, 403/404
de negocio con datos, y `GET /reportes/incidencias` PDF. No se asume que funcionan.

## Pendiente (priorizado)
1. Probar con DB real: login→JWT→CRUD por rol→PDF de reportes. (bloquea cierre)
2. Suite de tests automatizada (hoy `npm test` es placeholder que falla).
3. Evaluar `verificarRol(3)` en `GET /usuarios` (hoy cualquier rol autenticado lista nómina).
4. Rate-limit en `/auth/login` (enumeración + fuerza bruta).
5. `npm audit`: 1 vulnerabilidad high preexistente.
6. Borrado físico de cuenta + limpieza de avatar (hoy solo soft delete, por diseño).
7. `auth.register` acepta `avatar` como string de body sin upload (diseño heredado).
