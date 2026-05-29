import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import multer from 'multer';
import { DeleteObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { env } from '../config/env.js';
import s3 from '../config/s3.js';
import { ApiError } from './apiError.js';

export const uploadMimeTypes = {
  documents: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ],
  images: [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif',
  ],
  videos: [
    'video/mp4',
    'video/webm',
    'video/quicktime',
  ],
};

uploadMimeTypes.media = [
  ...uploadMimeTypes.images,
  ...uploadMimeTypes.videos,
];

uploadMimeTypes.all = [
  ...uploadMimeTypes.documents,
  ...uploadMimeTypes.media,
];

const mimeTypeExtensions = new Map([
  ['application/pdf', new Set(['.pdf'])],
  ['application/msword', new Set(['.doc'])],
  ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', new Set(['.docx'])],
  ['image/jpeg', new Set(['.jpg', '.jpeg'])],
  ['image/jpg', new Set(['.jpg', '.jpeg'])],
  ['image/png', new Set(['.png'])],
  ['image/webp', new Set(['.webp'])],
  ['image/gif', new Set(['.gif'])],
  ['video/mp4', new Set(['.mp4'])],
  ['video/webm', new Set(['.webm'])],
  ['video/quicktime', new Set(['.mov', '.qt'])],
]);

const allowedMimeTypes = new Set(uploadMimeTypes.all);
const storage = multer.memoryStorage();
const s3Client = env.awsS3Bucket ? s3 : null;

const normalizeAllowedMimeTypes = (mimeTypes = allowedMimeTypes) => (
  mimeTypes instanceof Set ? mimeTypes : new Set(mimeTypes)
);

const hasBytes = (buffer, bytes, offset = 0) => bytes.every((byte, index) => buffer[offset + index] === byte);
const asciiAt = (buffer, start, end) => buffer.subarray(start, end).toString('ascii');

const fileSignatureChecks = new Map([
  ['application/pdf', (buffer) => asciiAt(buffer, 0, 5) === '%PDF-'],
  ['application/msword', (buffer) => hasBytes(buffer, [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1])],
  ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', (buffer) => hasBytes(buffer, [0x50, 0x4b, 0x03, 0x04])],
  ['image/jpeg', (buffer) => hasBytes(buffer, [0xff, 0xd8, 0xff])],
  ['image/jpg', (buffer) => hasBytes(buffer, [0xff, 0xd8, 0xff])],
  ['image/png', (buffer) => hasBytes(buffer, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])],
  ['image/webp', (buffer) => asciiAt(buffer, 0, 4) === 'RIFF' && asciiAt(buffer, 8, 12) === 'WEBP'],
  ['image/gif', (buffer) => ['GIF87a', 'GIF89a'].includes(asciiAt(buffer, 0, 6))],
  ['video/mp4', (buffer) => asciiAt(buffer, 4, 8) === 'ftyp'],
  ['video/quicktime', (buffer) => asciiAt(buffer, 4, 8) === 'ftyp'],
  ['video/webm', (buffer) => hasBytes(buffer, [0x1a, 0x45, 0xdf, 0xa3])],
]);

const validateFileType = (file, allowedTypes = allowedMimeTypes) => {
  if (!file) return;

  const acceptedTypes = normalizeAllowedMimeTypes(allowedTypes);
  if (!acceptedTypes.has(file.mimetype)) {
    throw new ApiError(400, 'File type is not allowed');
  }

  const extension = path.extname(file.originalname || '').toLowerCase();
  const validExtensions = mimeTypeExtensions.get(file.mimetype);

  if (!extension || !validExtensions?.has(extension)) {
    throw new ApiError(400, 'File extension does not match the uploaded file type');
  }
};

const validateFileContents = (file, allowedTypes = allowedMimeTypes) => {
  validateFileType(file, allowedTypes);

  if (!Buffer.isBuffer(file.buffer) || file.buffer.length === 0) {
    throw new ApiError(400, 'Uploaded file is empty or invalid');
  }

  const signatureCheck = fileSignatureChecks.get(file.mimetype);
  if (signatureCheck && !signatureCheck(file.buffer)) {
    throw new ApiError(400, 'Uploaded file content does not match its declared file type');
  }
};

export const ensureUploadsDirectory = () => {
  if (env.awsS3Bucket) {
    return;
  }

  if (!fs.existsSync(env.uploadsDir)) {
    fs.mkdirSync(env.uploadsDir, { recursive: true });
  }
};

const getPublicS3Url = (key) => {
  const encodedKey = key.split('/').map(encodeURIComponent).join('/');
  const baseUrl =
    env.awsS3PublicUrl ||
    `https://${env.awsS3Bucket}.s3.${env.awsRegion}.amazonaws.com`;

  return `${baseUrl.replace(/\/+$/, '')}/${encodedKey}`;
};

const getUploadFileName = (file) => {
  const extension = path.extname(file.originalname || '').toLowerCase();
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

export const persistUploadedFile = async (file, folder = '', options = {}) => {
  if (!file) return null;

  validateFileContents(file, options.allowedMimeTypes);

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

export const persistUploadedFiles = async (files, folder = '', options = {}) => {
  if (!Array.isArray(files)) return [];
  return Promise.all(files.map((file) => persistUploadedFile(file, folder, options)));
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

const createFileFilter = (allowedTypes) => (_req, file, callback) => {
  try {
    validateFileType(file, allowedTypes);
    callback(null, true);
  } catch (error) {
    callback(error);
  }
};

const createUpload = ({
  allowedMimeTypes: routeAllowedMimeTypes = allowedMimeTypes,
  maxFileSize = 100 * 1024 * 1024,
} = {}) => multer({
  storage,
  limits: {
    fileSize: maxFileSize,
  },
  fileFilter: createFileFilter(routeAllowedMimeTypes),
});

export const uploadSingle = (fieldName, folder = '', options = {}) => [
  createUpload(options).single(fieldName),
  async (req, _res, next) => {
    try {
      if (req.file) {
        await persistUploadedFile(req.file, folder, options);
      }

      next();
    } catch (error) {
      next(error);
    }
  },
];

export const uploadArray = (fieldName, maxCount, folder = '', options = {}) => [
  Array.isArray(fieldName) ? createUpload(options).fields(fieldName) : createUpload(options).array(fieldName, maxCount),
  async (req, _res, next) => {
    try {
      const files = Array.isArray(req.files)
        ? req.files
        : Object.values(req.files || {}).flat();

      if (files.length) {
        await persistUploadedFiles(files, folder, options);
      }

      next();
    } catch (error) {
      next(error);
    }
  },
];
