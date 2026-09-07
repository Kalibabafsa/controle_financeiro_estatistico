import multer from 'multer';
import { AppError } from '../errors/AppError';

const ALLOWED_MIMETYPES = new Set(['image/png', 'image/jpeg', 'image/webp', 'application/pdf']);
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB (RSP5/seguranca.md item 4)

// Armazena em memória (buffer) — o service é quem envia ao Supabase Storage.
// Valida mimetype (não apenas extensão) e tamanho antes de aceitar o arquivo.
export const uploadAttachment = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
  fileFilter: (_req, file, callback) => {
    if (!ALLOWED_MIMETYPES.has(file.mimetype)) {
      callback(new AppError('Tipo de arquivo não permitido. Envie imagem (PNG/JPEG/WEBP) ou PDF.', 422, 'INVALID_FILE_TYPE'));
      return;
    }
    callback(null, true);
  },
});
