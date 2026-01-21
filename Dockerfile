# ============================================
# DOCKERFILE FINAL - CONSERVATÓRIO
# Imagem otimizada < 500MB
# ============================================

FROM node:18-alpine

# Instalar Python e dependências necessárias
RUN apk add --no-cache \
    python3 \
    py3-pip \
    make \
    g++ \
    && ln -sf python3 /usr/bin/python

WORKDIR /app

# ============================================
# INSTALAR DEPENDÊNCIAS NODE.JS
# ============================================

# Copiar package.json da RAIZ
COPY package*.json ./

# Instalar dependências (funciona com ou sem package-lock.json)
RUN if [ -f package-lock.json ]; then \
      npm ci --omit=dev; \
    else \
      npm install --omit=dev; \
    fi && \
    npm cache clean --force

# ============================================
# INSTALAR DEPENDÊNCIAS PYTHON (IA)
# ============================================

# Copiar requirements.txt do python_rag
COPY python_rag/requirements.txt ./python_rag/

# Instalar dependências Python
RUN pip3 install --no-cache-dir -r python_rag/requirements.txt

# ============================================
# COPIAR CÓDIGO DO PROJETO
# ============================================

# Copiar backend
COPY backend ./backend

# Copiar python_rag (IA)
COPY python_rag ./python_rag

# Copiar outros arquivos necessários (se houver)
COPY *.json ./

# ============================================
# LIMPEZA FINAL
# ============================================

RUN rm -rf \
    /root/.cache \
    /root/.npm \
    /tmp/* \
    .git \
    .github \
    .vscode \
    tests \
    cypress \
    docs \
    *.md \
    node_modules/.cache

# ============================================
# CONFIGURAÇÃO FINAL
# ============================================

# Criar diretório para cache Python (se necessário)
RUN mkdir -p /app/python_rag/cache

# Porta da aplicação
EXPOSE 3000

# Variável de ambiente para produção
ENV NODE_ENV=production

# Comando para iniciar a aplicação
CMD ["npm", "start"]