FROM node:18-alpine

WORKDIR /app

# Instalar dependências do sistema
RUN apk add --no-cache python3 make g++

# Copiar package files DA RAIZ
COPY package.json package-lock.json ./

# Instalar dependências
RUN npm ci --omit=dev && npm cache clean --force

# Copiar todo o código
COPY . .

# Limpar arquivos desnecessários
RUN rm -rf .git .github .vscode tests cypress docs *.md node_modules/.cache

# Porta
EXPOSE 3000

# Iniciar
CMD ["npm", "start"]