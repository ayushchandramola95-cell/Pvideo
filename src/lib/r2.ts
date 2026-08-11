import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const accountId = process.env.R2_ACCOUNT_ID || '';
const accessKeyId = process.env.R2_ACCESS_KEY_ID || '';
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY || '';
export const BUCKET_NAME = process.env.R2_BUCKET_NAME || '';
export const PUBLIC_DOMAIN = process.env.NEXT_PUBLIC_R2_PUBLIC_DOMAIN || '';

export function getR2Client(): S3Client {
  return new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
}

/**
 * Generate a pre-signed PUT URL for direct browser uploads to R2
 */
export async function getPresignedUploadUrl(key: string, contentType: string, expiresInSeconds = 3600): Promise<string> {
  const client = getR2Client();
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    ContentType: contentType,
  });

  return getSignedUrl(client, command, { expiresIn: expiresInSeconds });
}

/**
 * Delete an object from R2 bucket by key
 */
export async function deleteR2Object(key: string): Promise<void> {
  const client = getR2Client();
  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });
  await client.send(command);
}

/**
 * Helper to construct public URL for R2 objects
 */
export function getPublicMediaUrl(key: string | null | undefined, fallbackUrl: string | null | undefined = null): string {
  if (key) {
    const domain = PUBLIC_DOMAIN.replace(/\/$/, '');
    return `${domain}/${key}`;
  }
  return fallbackUrl || '';
}
