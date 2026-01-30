const { NestFactory } = require('@nestjs/core');
const { DataSource } = require('typeorm');
const AppModule = require('../dist/app.module').AppModule;

async function initDatabase() {
  console.log('🔄 Inicializando banco de dados (modo seguro)...\n');

  // Criar contexto da aplicação para obter configuração
  const app = await NestFactory.createApplicationContext(AppModule);
  
  try {
    // Obter DataSource do TypeORM
    const dataSource = app.get(DataSource);
    
    console.log('📊 Verificando conexão com banco de dados...');
    await dataSource.initialize();
    console.log('✅ Conectado ao banco de dados\n');

    console.log('📋 Criando tabelas (sem dropar existentes)...');
    // Usar runMigrations ou criar tabelas manualmente
    // Vamos usar synchronize(false) que não dropa tabelas existentes
    const queryRunner = dataSource.createQueryRunner();
    
    // Obter todas as entidades
    const entities = dataSource.entityMetadatas;
    
    for (const entity of entities) {
      const tableName = entity.tableName;
      console.log(`  📝 Verificando tabela: ${tableName}`);
      
      // Verificar se tabela existe
      const tableExists = await queryRunner.hasTable(tableName);
      
      if (!tableExists) {
        console.log(`  ➕ Criando tabela: ${tableName}`);
        // Criar tabela usando schema builder
        await queryRunner.createTable(
          queryRunner.connection.driver.createTableBuilder()
            .table(tableName)
            .columns(entity.columns.map(col => ({
              name: col.databaseName,
              type: col.type,
              isNullable: col.isNullable,
              isPrimary: col.isPrimary,
              isUnique: col.isUnique,
              default: col.default,
            })))
            .build()
        );
      } else {
        console.log(`  ✓ Tabela ${tableName} já existe`);
      }
    }
    
    // Sincronizar apenas novas colunas (não dropa nada)
    console.log('\n📋 Sincronizando schema (apenas adições)...');
    await dataSource.synchronize(false);
    console.log('✅ Schema sincronizado!\n');

    console.log('✅ Banco de dados inicializado com sucesso!');
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

