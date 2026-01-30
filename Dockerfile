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

# Build da aplicação
RUN npm run build

# Remover devDependencies após o build para reduzir tamanho da imagem
RUN npm prune --production

EXPOSE 3055

# Usar start:prod para produção
CMD ["npm", "run", "start:prod"]

