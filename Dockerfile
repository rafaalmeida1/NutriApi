FROM node:20-alpine

WORKDIR /app

# Instalar dependências do sistema se necessário
RUN apk add --no-cache python3 make g++

# Copiar arquivos de dependências
COPY package*.json ./

# Instalar todas as dependências (incluindo devDependencies para ter @nestjs/cli)
RUN npm install

# Copiar código fonte
COPY . .

# Build da aplicação (usando caminho direto para garantir que funcione)
RUN node node_modules/@nestjs/cli/bin/nest.js build

# NÃO remover @nestjs/cli mesmo em produção, caso seja necessário para start:dev
# Remover apenas outras devDependencies
RUN npm uninstall @nestjs/testing @types/jest @types/cookie-parser @types/node @types/nodemailer @types/uuid jest ts-jest ts-node tsconfig-paths typescript 2>/dev/null || true

EXPOSE 3055

# Usar start:prod para produção
CMD ["npm", "run", "start:prod"]

