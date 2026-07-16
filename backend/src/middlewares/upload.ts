import multer from 'multer';
import { randomUUID } from 'crypto';
import { mkdirSync } from 'fs';
import { writeFile } from 'fs/promises';
import path from 'path';
import { Request } from 'express';
import { cloudinary } from '../config/cloudinary';
import { env } from '../config/env';

export const uploadsDirectory = path.resolve(process.cwd(), 'uploads');
const reportUploadsDirectory = path.join(uploadsDirectory, 'reports');

// F011/F012: photo is mandatory. Format/size validated here (System
// Architecture section 13 — "validasi upload foto").
export const uploadReportPhoto = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error('Format foto harus JPG, PNG, atau WEBP.'));
    }
    cb(null, true);
  },
});

export async function persistUploadedPhoto(req: Request): Promise<string | undefined> {
  const file = req.file;
  if (!file) return undefined;

  if (env.uploadStorage === 'cloudinary') {
    return new Promise<string>((resolve, reject) => {
      let settled = false;
      const upload = cloudinary.uploader.upload_stream(
        {
          folder: 'akseskota/reports',
          resource_type: 'image',
          transformation: [{ width: 1600, height: 1600, crop: 'limit' }],
        },
        (error, result) => {
          if (settled) return;
          settled = true;
          clearTimeout(timeout);
          if (error || !result?.secure_url) return reject(error || new Error('Cloudinary tidak mengembalikan URL foto.'));
          resolve(result.secure_url);
        },
      );
      const timeout = setTimeout(() => {
        if (settled) return;
        settled = true;
        upload.destroy(new Error('Upload Cloudinary melewati batas waktu.'));
        reject(new Error('Upload Cloudinary melewati batas waktu.'));
      }, 30_000);
      upload.end(file.buffer);
    });
  }

  mkdirSync(reportUploadsDirectory, { recursive: true });
  const extension = path.extname(file.originalname).toLowerCase() || '.jpg';
  const filename = `${Date.now()}-${randomUUID()}${extension}`;
  await writeFile(path.join(reportUploadsDirectory, filename), file.buffer);
  return `${req.protocol}://${req.get('host')}/uploads/reports/${filename}`;
}
