const express = require("express");
const router = express.Router();
const pool = require("../db");
const verificarToken = require("../middlewares/verificarToken");
const verificarRol = require("../middlewares/verificarRol");
const { body, validationResult } = require("express-validator");



/**
 * TODA ESTA LOGICA DEBE IR DENTRO DE SERVICES, NO EN ROUTES. S
 * LOS CONTROLLERS LLAMAN AL SERVICE, Y EL SERVICE LLAMA A LA DB.
 * ROUTES SOLO DEBEN LLAMAR A LOS CONTROLLERS, NO A LA DB DIRECTAMENTE.
 * LOS ERRORES DE RUTAS SE ESTAN IMPRIMIENDO EN CONSOLA DE SERVIDOR , ESTO NO DEBE SER ASI, DEBE HABER UN MIDDLEWARE DE ERRORES 
 * QUE LOS MANEJE Y LOS IMPRIMA EN CONSOLA DEL NAVEGADOR NO EN EL SERVIDOR.
 */

router.get("/", async (req, res, next) => {
  try {
    const r = await pool.query("SELECT * FROM areas WHERE activo=1 ORDER BY descripcion");
    res.json(r.rows);
  } catch (e) { next(e); }
});

router.get("/:id", async (req, res, next) => {
  try {
    const r = await pool.query("SELECT * FROM areas WHERE id_area=$1", [req.params.id]);
    if (r.rows.length===0) return res.status(404).json({ error: "Área no encontrada" });
    res.json(r.rows[0]);
  } catch(e){ next(e); }
});

router.post("/", verificarToken, verificarRol(2,3), [body("descripcion").isString().trim().isLength({ min:1,max:100 })], async (req,res,next)=>{
  const errors=validationResult(req); if(!errors.isEmpty()) return res.status(400).json({errors:errors.array()});
  try{
    const r= await pool.query(`INSERT INTO areas (descripcion, activo) VALUES ($1,1) RETURNING *`,[req.body.descripcion]);
    res.status(201).json(r.rows[0]);
  }catch(e){next(e);}
});

router.put("/:id", verificarToken, verificarRol(2,3), [body("descripcion").isString().trim().isLength({ min:1,max:100 })], async(req,res,next)=>{
  const errors=validationResult(req); if(!errors.isEmpty()) return res.status(400).json({errors:errors.array()});
  try{
    const r= await pool.query(`UPDATE areas SET descripcion=$1 WHERE id_area=$2 RETURNING *`,[req.body.descripcion, req.params.id]);
    if(r.rows.length===0) return res.status(404).json({ error:"Área no encontrada"});
    res.json(r.rows[0]);
  }catch(e){next(e);}
});

router.delete("/:id", verificarToken, verificarRol(2,3), async(req,res,next)=>{
  try{
    const r= await pool.query(`UPDATE areas SET activo=0 WHERE id_area=$1 RETURNING *`,[req.params.id]);
    if(r.rows.length===0) return res.status(404).json({ error:"Área no encontrada"});
    res.json({ mensaje:"Área desactivada", area:r.rows[0]});
  }catch(e){next(e);}
});

module.exports = router;
