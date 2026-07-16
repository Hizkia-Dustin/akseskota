import multer from 'multer';
import { reportPhotoStorage } from '../config/cloudinary';

// F011/F012: photo is mandatory. Format/size validated here (System
// Architecture section 13 — "validasi upload foto").
export const uploadReportPhoto = multer({
  storage: reportPhotoStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error('Format foto harus JPG, PNG, atau WEBP.'));
    }
    cb(null, true);
  },
});
