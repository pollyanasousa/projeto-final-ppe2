FROM node:18-alpine

WORKDIR /app

# Instalar dependências do sistema (se precisar de Python/C++)
RUN apk add --no-cache python3 make g++

# Copiar package.json
COPY package*.json ./

# Instalar apenas produção e limpar cache
RUN npm ci --only=production && npm cache clean --force

# Copiar código
COPY . .

# Limpar arquivos desnecessários
RUN rm -rf .git .github .vscode tests cypress frontend docs *.md node_modules/.cache

# Porta
EXPOSE 3000

# Iniciar
CMD ["npm", "start"]