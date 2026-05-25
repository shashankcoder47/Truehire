import fs from 'node:fs/promises';
import path from 'node:path';
import mammoth from 'mammoth';
import { PDFParse } from 'pdf-parse';
import { env } from '../config/env.js';

const normalizeSkill = (value) => (
  String(value || '')
    .trim()
    .replace(/\s+/g, ' ')
);

export const parseRequiredSkills = (value) => {
  if (Array.isArray(value)) return value.map(normalizeSkill).filter(Boolean);

  return String(value || '')
    .split(/\r?\n|,|;/)
    .map(normalizeSkill)
    .filter(Boolean);
};

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const textIncludesSkill = (text, skill) => {
  const normalizedText = String(text || '').toLowerCase();
  const normalizedSkill = normalizeSkill(skill).toLowerCase();
  if (!normalizedText || !normalizedSkill) return false;

  const compactSkill = normalizedSkill.replace(/[.\s+#-]+/g, '');
  const compactText = normalizedText.replace(/[.\s+#-]+/g, '');
  if (compactSkill.length >= 2 && compactText.includes(compactSkill)) return true;

  return new RegExp(`(^|[^a-z0-9])${escapeRegExp(normalizedSkill)}([^a-z0-9]|$)`, 'i')
    .test(normalizedText);
};

const resolveLocalUploadPath = (storedPath) => {
  if (!storedPath || /^https?:\/\//i.test(storedPath)) return null;
  const normalized = String(storedPath).replace(/\\/g, '/');
  const uploadPrefix = '/uploads/';
  if (!normalized.startsWith(uploadPrefix)) return null;
  return path.join(env.uploadsDir, normalized.slice(uploadPrefix.length));
};

export const extractResumeText = async ({ file, storedPath } = {}) => {
  const sourceName = file?.originalname || file?.filename || storedPath || '';
  const extension = path.extname(sourceName).toLowerCase();
  const mimeType = String(file?.mimetype || '').toLowerCase();
  const buffer = file?.buffer || (resolveLocalUploadPath(storedPath)
    ? await fs.readFile(resolveLocalUploadPath(storedPath))
    : null);

  if (!buffer) return '';

  if (mimeType.includes('pdf') || extension === '.pdf') {
    const parser = new PDFParse({ data: buffer });
    try {
      const parsed = await parser.getText();
      return parsed?.text || '';
    } finally {
      await parser.destroy();
    }
  }

  if (
    mimeType.includes('wordprocessingml.document') ||
    extension === '.docx'
  ) {
    const parsed = await mammoth.extractRawText({ buffer });
    return parsed?.value || '';
  }

  return '';
};

export const calculateResumeMatch = ({ resumeText, requiredSkills, matchPercentage }) => {
  const skills = parseRequiredSkills(requiredSkills);
  const threshold = Math.max(0, Math.min(100, Number(matchPercentage ?? 0) || 0));

  if (skills.length === 0) {
    return {
      matchScore: null,
      matchedSkills: [],
      missingSkills: [],
      matchStatus: 'MATCHED',
    };
  }

  const matchedSkills = skills.filter((skill) => textIncludesSkill(resumeText, skill));
  const missingSkills = skills.filter((skill) => !matchedSkills.includes(skill));
  const matchScore = Math.round((matchedSkills.length / skills.length) * 100);

  return {
    matchScore,
    matchedSkills,
    missingSkills,
    matchStatus: matchScore >= threshold ? 'MATCHED' : 'NOT_MATCHED',
  };
};
