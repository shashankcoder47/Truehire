import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import multer from 'multer';
import { DeleteObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { env } from '../config/env.js';
import s3 from '../config/s3.js';
import { ApiError } from './apiError.js';

const allowedMimeTypes = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
  'video/mp4',
  'video/webm',
  'video/quicktime',
]);

export const ensureUploadsDirectory = () => {
  if (env.awsS3Bucket) {
    return;
  }

  if (!fs.existsSync(env.uploadsDir)) {
    fs.mkdirSync(env.uploadsDir, { recursive: true });
  }
};

const storage = multer.memoryStorage();

const s3Client = env.awsS3Bucket ? s3 : null;

const getPublicS3Url = (key) => {
  const encodedKey = key.split('/').map(encodeURIComponent).join('/');
  const baseUrl =
    env.awsS3PublicUrl ||
    `https://${env.awsS3Bucket}.s3.${env.awsRegion}.amazonaws.com`;

  return `${baseUrl.replace(/\/+$/, '')}/${encodedKey}`;
};

const getUploadFileName = (file) => {
  const extension = path.extname(file.originalname || '');
  return `${Date.now()}-${crypto.randomUUID()}${extension}`;
};

const normalizeFolder = (folder = '') => String(folder || '').replace(/^\/+|\/+$/g, '');

const persistFile = async (file, folder = '') => {
  const filename = getUploadFileName(file);
  const normalizedFolder = normalizeFolder(folder);
  const key = normalizedFolder ? `${normalizedFolder}/${filename}` : filename;

  if (s3Client) {
    await s3Client.send(
      new PutObjectCommand({
        Bucket: env.awsS3Bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      }),
    );

    return {
      filename,
      key,
      path: getPublicS3Url(key),
      storage: 's3',
    };
  }

  ensureUploadsDirectory();
  const destinationDir = normalizedFolder ? path.join(env.uploadsDir, normalizedFolder) : env.uploadsDir;
  await fsp.mkdir(destinationDir, { recursive: true });

  const diskPath = path.join(destinationDir, filename);
  await fsp.writeFile(diskPath, file.buffer);

  return {
    filename,
    key,
    path: `/uploads/${key.replace(/\\/g, '/')}`,
    diskPath,
    storage: 'local',
  };
};

export const persistUploadedFile = async (file, folder = '') => {
  if (!file) return null;

  const stored = await persistFile(file, folder);
  file.filename = stored.filename;
  file.key = stored.key;
  file.path = stored.path;
  file.location = stored.path;
  file.storage = stored.storage;
  if (stored.diskPath) {
    file.diskPath = stored.diskPath;
  }

  return file;
};

export const persistUploadedFiles = async (files, folder = '') => {
  if (!Array.isArray(files)) return [];
  return Promise.all(files.map((file) => persistUploadedFile(file, folder)));
};

export const deleteUploadedFile = async (file) => {
  if (!file) return;

  if (s3Client && file.key) {
    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: env.awsS3Bucket,
        Key: file.key,
      }),
    );
    return;
  }

  if (file.diskPath) {
    await fsp.rm(file.diskPath, { force: true });
  }
};

const fileFilter = (_req, file, callback) => {
  if (!allowedMimeTypes.has(file.mimetype)) {
    callback(new ApiError(400, 'Only PDF, DOC, DOCX, JPG, JPEG, PNG, WEBP, GIF, SVG, MP4, WEBM, and MOV files are allowed'));
    return;
  }

  callback(null, true);
};

const upload = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024,
  },
  fileFilter,
});

export const uploadSingle = (fieldName, folder = '') => [
  upload.single(fieldName),
  async (req, _res, next) => {
    try {
      if (req.file) {
        await persistUploadedFile(req.file, folder);
      }

      next();
    } catch (error) {
      next(error);
    }
  },
];

export const uploadArray = (fieldName, maxCount, folder = '') => [
  Array.isArray(fieldName) ? upload.fields(fieldName) : upload.array(fieldName, maxCount),
  async (req, _res, next) => {
    try {
      const files = Array.isArray(req.files)
        ? req.files
        : Object.values(req.files || {}).flat();

      if (files.length) {
        await persistUploadedFiles(files, folder);
      }

      next();
    } catch (error) {
      next(error);
    }
  },
];
