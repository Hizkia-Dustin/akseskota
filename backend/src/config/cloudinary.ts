import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import { env } from './env';

cloudinary.config({
  cloud_name: env.cloudinary.cloudName,
  api_key: env.cloudinary.apiKey,
  api_secret: env.cloudinary.apiSecret,
});

// Used by multer to stream uploaded photos straight to Cloudinary.
// Applies to F011 (Tambah Kondisi Jalur) and F012 (Laporkan Hambatan),
// both of which require a mandatory photo per acceptance criteria.
export const reportPhotoStorage = new CloudinaryStorage({
  cloudinary,
  params: async () => ({
    folder: 'akseskota/reports',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 1600, height: 1600, crop: 'limit' }],
  }),
});

export { cloudinary };
