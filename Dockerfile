FROM node:20-alpine AS builder

# Instalar dependências de build para bcrypt e outras libs nativas
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copiar package files
COPY package*.json ./

# Instalar dependências (garantir que devDependencies sejam instaladas durante build)
# npm ci instala devDependencies por padrão, a menos que NODE_ENV=production
# Definir NODE_ENV=development explicitamente para garantir instalação de devDependencies
RUN NODE_ENV=development npm ci

# Copiar código fonte
COPY . .

# Build da aplicação
RUN npm run build

# Remover dev dependencies
RUN npm prune --production

# Imagem de produção
FROM node:20-alpine

# Instalar apenas dependências de runtime (incluindo wget para health checks)
RUN apk add --no-cache openssl wget

WORKDIR /app

# Criar usuário não-root ANTES de copiar arquivos
RUN addgroup -g 1001 -S nodejs && adduser -S nestjs -u 1001

# Copiar node_modules e build
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./

# Criar diretório de uploads com permissões corretas
RUN mkdir -p /app/uploads/images /app/uploads/pdfs

# Dar permissão ao usuário nestjs em TODO o diretório /app
RUN chown -R nestjs:nodejs /app

# Mudar para usuário não-root
USER nestjs

EXPOSE 3055

# Usar start:prod para produção (não precisa do nest)
CMD ["npm", "run", "start:prod"]
