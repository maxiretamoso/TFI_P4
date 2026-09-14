# TODO - Pendientes no bloqueantes (post-revisión final)

Anotados tras la revisión final del backend - no bloquean el inicio del frontend, retomar si sobra tiempo.

- [ ] Extraer BREAD duplicado a helper `makeBreadRouter(tabla, campos)` para evitar código repetido en `categorias`/`articulos`/`areas`/`estados`/`usuarios`.
- [ ] Unificar formato de error: validación retorna `{ errors: [...] }` vs resto `{ error: "mensaje" }` → llevar a `{ error, details }`.
- [ ] Reemplazar fallback `usuario@example.com` en `routes/incidencias.js:186,238` por `null` o exigir `MAIL_TO_TEST` para no enviar a dominio ficticio en producción.
- [ ] Completar documentación Swagger de `areas`, `estados` y `usuarios` (ya está completa para `categorias`, `articulos`, `incidencias`, `dashboard` y `reportes`).
- [ ] Agregar `rate-limit` / `helmet` como capa extra de seguridad (no exigido por la rúbrica).
