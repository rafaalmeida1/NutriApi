import * as MinIO from 'minio';

async function setupMinIO() {
  const client = new MinIO.Client({
    endPoint: process.env.MINIO_ENDPOINT || 'localhost',
    port: parseInt(process.env.MINIO_PORT || '9000', 10),
    useSSL: process.env.MINIO_USE_SSL === 'true',
    accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
    secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
  });

  const buckets = ['images', 'pdfs'];

  try {
    for (const bucket of buckets) {
      // Verificar se bucket existe
      const exists = await client.bucketExists(bucket);
      if (!exists) {
        await client.makeBucket(bucket, 'us-east-1');
        console.log(`✅ Bucket ${bucket} criado`);
      }

      // Configurar política pública
      const policy = {
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: { AWS: ['*'] },
            Action: ['s3:GetObject'],
            Resource: [`arn:aws:s3:::${bucket}/*`],
          },
        ],
      };

      try {
        await client.setBucketPolicy(bucket, JSON.stringify(policy));
        console.log(`✅ Política pública configurada para ${bucket}`);
      } catch (error) {
        console.warn(`⚠️  Erro ao configurar política para ${bucket}:`, error);
      }

      // Configurar CORS
      const corsConfig = [
        {
          AllowedOrigins: ['*'],
          AllowedMethods: ['GET', 'HEAD', 'PUT', 'POST', 'DELETE'],
          AllowedHeaders: ['*'],
          ExposeHeaders: ['ETag'],
          MaxAgeSeconds: 3000,
        },
      ];

      try {
        await client.setBucketCors(bucket, corsConfig);
        console.log(`✅ CORS configurado para ${bucket}`);
      } catch (error) {
        console.warn(`⚠️  Erro ao configurar CORS para ${bucket}:`, error);
      }
    }

    console.log('✅ MinIO configurado com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao configurar MinIO:', error);
    process.exit(1);
  }
}

setupMinIO();

