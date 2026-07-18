import multer from 'multer';
import { randomUUID } from 'crypto';
import { mkdirSync } from 'fs';
import { unlink, writeFile } from 'fs/promises';
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

export async function persistUploadedPhoto(req: Request, folder = 'reports'): Promise<string | undefined> {
  const file = req.file;
  if (!file) return undefined;

  if (env.uploadStorage === 'cloudinary') {
    return new Promise<string>((resolve, reject) => {
      let settled = false;
      const upload = cloudinary.uploader.upload_stream(
        {
          folder: `akseskota/${folder}`,
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

export async function deletePersistedPhoto(photoUrl: string | undefined): Promise<void> {
  if (!photoUrl) return;
  try {
    const parsed = new URL(photoUrl);
    if (parsed.hostname === 'res.cloudinary.com') {
      const uploadMarker = '/upload/';
      const markerIndex = parsed.pathname.indexOf(uploadMarker);
      if (markerIndex < 0) return;
      const afterUpload = parsed.pathname.slice(markerIndex + uploadMarker.length).replace(/^v\d+\//, '');
      const publicId = decodeURIComponent(afterUpload).replace(/\.[^/.]+$/, '');
      if (publicId.startsWith('akseskota/')) await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
      return;
    }

    const uploadPrefix = '/uploads/';
    const uploadIndex = parsed.pathname.indexOf(uploadPrefix);
    if (uploadIndex < 0) return;
    const relativePath = decodeURIComponent(parsed.pathname.slice(uploadIndex + uploadPrefix.length));
    const target = path.resolve(uploadsDirectory, relativePath);
    if (target.startsWith(`${uploadsDirectory}${path.sep}`)) await unlink(target).catch(() => undefined);
  } catch {
    // Cleanup is best-effort and must not hide the original request error.
  }
}
