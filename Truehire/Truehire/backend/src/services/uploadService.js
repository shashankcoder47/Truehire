import fs from 'node:fs/promises';
import path from 'node:path';
import { prisma } from '../config/database.js';
import { env } from '../config/env.js';
import { ApiError } from '../utils/apiError.js';
import { deleteUploadedFile } from '../utils/upload.js';

const uploadSelect = {
  id: true,
  originalName: true,
  fileName: true,
  filePath: true,
  fileType: true,
  fileSize: true,
  uploadedById: true,
  createdAt: true,
  uploadedBy: {
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
    },
  },
};

const resolveDiskPath = (storedPath) => {
  if (/^https?:\/\//i.test(storedPath)) {
    return null;
  }

  if (path.isAbsolute(storedPath)) {
    return storedPath;
  }

  return path.resolve(env.uploadsDir, path.basename(storedPath));
};

const resolveS3Key = (storedPath, fileName) => {
  if (!storedPath) return fileName || null;

  if (!/^https?:\/\//i.test(storedPath)) {
    return storedPath.replace(/^\/?uploads\/?/, '');
  }

  try {
    const url = new URL(storedPath);
    const publicBasePath = env.awsS3PublicUrl ? new URL(env.awsS3PublicUrl).pathname.replace(/\/+$/, '') : '';
    return decodeURIComponent(url.pathname.replace(publicBasePath, '').replace(/^\/+/, '')) || fileName || null;
  } catch {
    return fileName || null;
  }
};

export const createUploadRecord = async (userId, file) => {
  if (!file) {
    throw new ApiError(400, 'A PDF or image file is required');
  }

  try {
    return await prisma.upload.create({
      data: {
        originalName: file.originalname,
        fileName: file.filename,
        filePath: file.path,
        fileType: file.mimetype,
        fileSize: file.size,
        uploadedById: userId,
      },
      select: uploadSelect,
    });
  } catch (error) {
    if (file.key || file.diskPath) {
      await deleteUploadedFile(file);
    } else {
      const diskPath = resolveDiskPath(file.path);
      if (diskPath) {
        await fs.rm(diskPath, { force: true });
      }
    }
    throw error;
  }
};

export const getAllFiles = async () =>
  prisma.upload.findMany({
    orderBy: { createdAt: 'desc' },
    select: uploadSelect,
  });

export const getFileById = async (id) => {
  const upload = await prisma.upload.findUnique({
    where: { id },
    select: uploadSelect,
  });

  if (!upload) {
    throw new ApiError(404, 'File metadata not found');
  }

  return upload;
};

export const deleteFileById = async (id) => {
  const upload = await prisma.upload.findUnique({
    where: { id },
  });

  if (!upload) {
    throw new ApiError(404, 'File metadata not found');
  }

  const absolutePath = resolveDiskPath(upload.filePath);

  if (env.awsS3Bucket) {
    const key = resolveS3Key(upload.filePath, upload.fileName);
    if (key) {
      await deleteUploadedFile({ key });
    }
  } else if (absolutePath) {
    await fs.rm(absolutePath, { force: true });
  }

  await prisma.upload.delete({
    where: { id },
  });
};
