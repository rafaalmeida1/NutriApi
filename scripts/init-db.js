const { NestFactory } = require('@nestjs/core');
const { getConnectionToken } = require('@nestjs/typeorm');
const AppModule = require('../dist/app.module').AppModule;

async function initDatabase() {
  console.log('🔄 Inicializando banco de dados...\n');

  // Temporariamente habilitar synchronize
  process.env.DB_SYNCHRONIZE = 'true';
  
  // Criar contexto da aplicação para obter configuração
  const app = await NestFactory.createApplicationContext(AppModule);
  
  try {
    // Obter Connection do TypeORM (DataSource no TypeORM v0.3+)
    const connection = app.get(getConnectionToken());
    
    console.log('📊 Verificando conexão com banco de dados...');
    if (!connection.isConnected) {
      await connection.connect();
    }
    console.log('✅ Conectado ao banco de dados\n');

    console.log('📋 Sincronizando schema do banco de dados...');
    // Sincronizar schema (cria tabelas se não existirem, atualiza se necessário)
    await connection.synchronize(false); // false = não dropa tabelas existentes
    console.log('✅ Schema sincronizado com sucesso!\n');

    console.log('✅ Banco de dados inicializado com sucesso!');
    console.log('📝 Você pode agora executar: npm run create-admin');
  } catch (error) {
    console.error('❌ Erro ao inicializar banco de dados:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  } finally {
    await app.close();
  }
}

initDatabase();
