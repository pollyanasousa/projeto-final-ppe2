FROM node:18-alpine

WORKDIR /app

# Instalar dependências do sistema
RUN apk add --no-cache python3 make g++

# Copiar package files
COPY package.json package-lock.json ./

# Instalar dependências (sem --only, use --omit)
RUN npm ci --omit=dev && npm cache clean --force

# Copiar código
COPY . .

# Limpar arquivos desnecessários
RUN rm -rf .git .github .vscode tests cypress frontend docs *.md node_modules/.cache

# Porta
EXPOSE 3000

# Iniciar
CMD ["npm", "start"]