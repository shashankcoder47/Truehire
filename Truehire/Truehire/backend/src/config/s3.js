import { S3Client } from '@aws-sdk/client-s3';
import { env } from './env.js';

const credentials =
  env.awsAccessKeyId && env.awsSecretAccessKey
    ? {
        accessKeyId: env.awsAccessKeyId,
        secretAccessKey: env.awsSecretAccessKey,
      }
    : undefined;

export const s3 = new S3Client({
  region: env.awsRegion,
  ...(credentials ? { credentials } : {}),
});

export default s3;
