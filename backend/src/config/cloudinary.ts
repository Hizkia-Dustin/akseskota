import * as cloudinarySdk from 'cloudinary';
import type { StorageEngine } from 'multer';
import { env } from './env';

const cloudinary = cloudinarySdk.v2;
const createCloudinaryStorage = require('multer-storage-cloudinary') as (options: unknown) => StorageEngine;

cloudinary.config({
  cloud_name: env.cloudinary.cloudName,
  api_key: env.cloudinary.apiKey,
  api_secret: env.cloudinary.apiSecret,
});

// Used by multer to stream uploaded photos straight to Cloudinary.
// Applies to F011 (Tambah Kondisi Jalur) and F012 (Laporkan Hambatan),
// both of which require a mandatory photo per acceptance criteria.
export const reportPhotoStorage = createCloudinaryStorage({
  // multer-storage-cloudinary v2 expects the package root and accesses its
  // `v2` property internally.
  cloudinary: cloudinarySdk,
  params: () => ({
    folder: 'akseskota/reports',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 1600, height: 1600, crop: 'limit' }],
  }),
});

export { cloudinary };
