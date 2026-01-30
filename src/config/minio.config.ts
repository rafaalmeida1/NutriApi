import * as MinIO from 'minio';

export function createMinioClient(): MinIO.Client {
  return new MinIO.Client({
    endPoint: process.env.MINIO_ENDPOINT || 'localhost',
    port: parseInt(process.env.MINIO_PORT || '9000', 10),
    useSSL: process.env.MINIO_USE_SSL === 'true',
    accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
    secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
  });
}

export const MINIO_BUCKETS = {
  IMAGES: process.env.MINIO_BUCKET_IMAGES || 'images',
  PDFS: process.env.MINIO_BUCKET_PDFS || 'pdfs',
};

