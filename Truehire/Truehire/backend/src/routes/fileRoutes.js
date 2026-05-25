import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validateRequest.js';
import {
  createUploadRecord,
  deleteFileById,
  getAllFiles,
  getFileById,
} from '../services/uploadService.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { uploadSingle } from '../utils/upload.js';
import { fileIdParamSchema } from '../validators/fileValidators.js';

const router = Router();

router.post(
  '/upload',
  authenticate,
  uploadSingle('file'),
  asyncHandler(async (req, res) => {
    const file = await createUploadRecord(req.auth.sub, req.file);

    res.status(201).json({
      success: true,
      message: 'File uploaded successfully',
      data: file,
    });
  }),
);

router.get(
  '/files',
  authenticate,
  asyncHandler(async (_req, res) => {
    const files = await getAllFiles();

    res.json({
      success: true,
      data: files,
    });
  }),
);

router.get(
  '/files/:id',
  authenticate,
  validateRequest({ params: fileIdParamSchema }),
  asyncHandler(async (req, res) => {
    const file = await getFileById(req.validatedParams.id);

    res.json({
      success: true,
      data: file,
    });
  }),
);

router.delete(
  '/files/:id',
  authenticate,
  validateRequest({ params: fileIdParamSchema }),
  asyncHandler(async (req, res) => {
    await deleteFileById(req.validatedParams.id);

    res.json({
      success: true,
      message: 'File deleted successfully',
    });
  }),
);

export default router;
