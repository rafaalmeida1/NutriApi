import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export function databaseConfig(): TypeOrmModuleOptions {
  // Permitir synchronize via variável de ambiente para inicialização
  const allowSynchronize = process.env.DB_SYNCHRONIZE === 'true' || process.env.NODE_ENV !== 'production';
  
  return {
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5455', 10),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_DATABASE || 'nutriapp',
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    synchronize: allowSynchronize,
    logging: process.env.NODE_ENV === 'development' || process.env.DB_LOGGING === 'true',
  };
}

