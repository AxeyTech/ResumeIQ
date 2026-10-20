import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import multer from 'multer';
import { env } from '../config/env.js';
import { ApiError } from '../utils/apiError.js';

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
]);

const EXT_BY_MIME = {
  'application/pdf': 'pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
};

// Magic-byte signatures, checked in addition to the client-supplied MIME
// type (NFR-SE5) since Content-Type headers are trivially spoofable.
const SIGNATURES = {
  pdf: (buf) => buf.slice(0, 5).toString('ascii') === '%PDF-',
  // .docx is a ZIP archive; ZIP files start with "PK\x03\x04" (or empty/spanned variants).
  docx: (buf) => buf.length > 4 && buf[0] === 0x50 && buf[1] === 0x4b && (buf[2] === 0x03 || buf[2] === 0x05 || buf[2] === 0x07),
};

fs.mkdirSync(env.UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, env.UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = EXT_BY_MIME[file.mimetype] || 'bin';
    cb(null, `${Date.now()}-${crypto.randomUUID()}.${ext}`);
  },
});

function fileFilter(_req, file, cb) {
  if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
    return cb(
      ApiError.badRequest('Only PDF and DOCX files are supported.', { code: 'UNSUPPORTED_FILE_TYPE' }),
    );
  }
  cb(null, true);
}

export const uploadResume = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: env.MAX_UPLOAD_MB * 1024 * 1024,
    files: 1,
  },
}).single('resume');

/**
 * Second layer of validation after multer has written the file to disk:
 * checks the actual byte signature matches the claimed type (NFR-SE5), and
 * derives our internal `fileType` field. Deletes the file and throws on
 * mismatch so nothing bad ever reaches the parser.
 */
export function verifyUploadedFile(req, _res, next) {
  if (!req.file) {
    return next(ApiError.badRequest('No resume file was uploaded. Attach it under the "resume" field.'));
  }

  const buffer = fs.readFileSync(req.file.path);
  const fileType = EXT_BY_MIME[req.file.mimetype];
  const signatureOk = SIGNATURES[fileType]?.(buffer);

  if (!signatureOk) {
    fs.unlink(req.file.path, () => {});
    return next(
      ApiError.badRequest(
        'This file does not look like a valid PDF or DOCX file (its content does not match its extension).',
        { code: 'INVALID_FILE_SIGNATURE' },
      ),
    );
  }

  req.file.buffer = buffer;
  req.file.fileType = fileType;
  next();
}

export function resumeStoragePath(fileName) {
  return path.join(env.UPLOAD_DIR, fileName);
}

const avatarMemoryStorage = multer.memoryStorage();

function avatarFilter(_req, file, cb) {
  if (!file.mimetype.startsWith('image/')) {
    return cb(ApiError.badRequest('Only image files (JPG, PNG, WebP) are allowed for profile pictures.'));
  }
  cb(null, true);
}

export const uploadAvatar = multer({
  storage: avatarMemoryStorage,
  fileFilter: avatarFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
}).single('avatar');

