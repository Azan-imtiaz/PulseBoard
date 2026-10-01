import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { config } from '../config.js';
import { HttpError } from '../lib/errors.js';
import { logger } from '../lib/logger.js';

const client = new S3Client({
  region: config.S3_REGION,
  endpoint: config.S3_ENDPOINT,
  // Supabase Storage (and most S3-compatible stores) need path-style URLs.
  forcePathStyle: Boolean(config.S3_ENDPOINT),
  credentials:
    config.S3_ACCESS_KEY_ID && config.S3_SECRET_ACCESS_KEY
      ? { accessKeyId: config.S3_ACCESS_KEY_ID, secretAccessKey: config.S3_SECRET_ACCESS_KEY }
      : undefined,
});

function bucket() {
  if (!config.S3_BUCKET) throw new HttpError(503, 'File uploads are not configured on this server', 'uploads_disabled');
  return config.S3_BUCKET;
}

export function presignUpload(key, contentType, size) {
  const command = new PutObjectCommand({ Bucket: bucket(), Key: key, ContentType: contentType, ContentLength: size });
  return getSignedUrl(client, command, { expiresIn: 300 });
}

export function presignDownload(key, fileName) {
  const command = new GetObjectCommand({
    Bucket: bucket(),
    Key: key,
    ResponseContentDisposition: `attachment; filename="${encodeURIComponent(fileName)}"`,
  });
  return getSignedUrl(client, command, { expiresIn: 300 });
}

export async function statObject(key) {
  try {
    const head = await client.send(new HeadObjectCommand({ Bucket: bucket(), Key: key }));
    return { size: head.ContentLength ?? 0, contentType: head.ContentType ?? 'application/octet-stream' };
  } catch (err) {
    if (err.name === 'NotFound') return null;
    throw err;
  }
}

export function deleteObject(key) {
  return client.send(new DeleteObjectCommand({ Bucket: bucket(), Key: key }));
}

// Cleanup after the database records are already gone: never throws, never waits.
// A leftover object is cheaper than a failed request.
export function discardObjects(keys) {
  if (!keys.length || !config.S3_BUCKET) return;
  for (const key of keys) {
    deleteObject(key).catch((err) => logger.warn({ err, key }, 'failed to delete stored object'));
  }
}
