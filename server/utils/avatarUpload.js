import multer from "multer";
import path from "path";
import fs from "fs";
import { crearError } from "./httpError.js";

const uploadDir = path.join(import.meta.dirname, "..", "publico", "avatares");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const EXTENSIONES = [".jpg", ".jpeg", ".png", ".webp"];

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `avatar-${req.params.id}-${Date.now()}${ext}`);
  },
});

const uploadAvatar = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!file.mimetype.startsWith("image/") || !EXTENSIONES.includes(ext)) {
      return cb(crearError(400, "Solo se permiten imágenes jpg, png o webp"));
    }
    cb(null, true);
  },
});

export { uploadAvatar, uploadDir };
