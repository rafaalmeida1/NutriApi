const { NestFactory } = require('@nestjs/core');
const { getRepositoryToken } = require('@nestjs/typeorm');
const readline = require('readline');

// Importar módulos compilados
const AppModule = require('../dist/app.module').AppModule;

async function createAdmin() {
  const app = await NestFactory.createApplicationContext(AppModule);
  
  // Obter serviços usando as classes importadas
  const { UsersService } = require('../dist/users/users.service');
  const { User } = require('../dist/users/entities/user.entity');
  
  const usersService = app.get(UsersService);
  const userRepository = app.get(getRepositoryToken(User));

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const question = (query) => {
    return new Promise((resolve) => rl.question(query, resolve));
  };

  try {
    console.log('=== Criar Usuário Administrador ===\n');
    
    const email = await question('Email do administrador: ');
    
    if (!email || !email.includes('@')) {
      console.error('Email inválido!');
      process.exit(1);
    }

    // Verificar se já existe
    const existing = await usersService.findByEmail(email);
    if (existing) {
      console.log(`\nUsuário com email ${email} já existe!`);
      if (existing.role === 'admin') {
        console.log('Este usuário já é um administrador.');
      } else {
        const update = await question('Deseja tornar este usuário um administrador? (s/n): ');
        if (update.toLowerCase() === 's') {
          existing.role = 'admin';
          await userRepository.save(existing);
          console.log('Usuário atualizado para administrador!');
        }
      }
      process.exit(0);
    }

    const password = await question('Senha: ');
    
    if (!password || password.length < 6) {
      console.error('Senha deve ter pelo menos 6 caracteres!');
      process.exit(1);
    }

    const user = await usersService.createAdmin(email, password);
    console.log(`\n✅ Administrador criado com sucesso!`);
    console.log(`Email: ${user.email}`);
    console.log(`ID: ${user.id}`);
    console.log(`\n⚠️  IMPORTANTE: Faça login com Google usando este email para vincular a conta.`);
  } catch (error) {
    console.error('Erro ao criar administrador:', error);
    process.exit(1);
  } finally {
    rl.close();
    await app.close();
  }
}

createAdmin();
