# ==================================================
# STAGE 1: Build dependencies
# ==================================================
FROM python:3.11-slim as builder

# Instalar apenas o necessario para compilar
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Instalar dependencias Python
WORKDIR /app
COPY python_rag/requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt

# ==================================================
# STAGE 2: Runtime (imagem final)
# ==================================================
FROM python:3.11-slim

# Instalar Node.js 18 LTS
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    && curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y --no-install-recommends nodejs \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Copiar dependencias Python do stage anterior
COPY --from=builder /root/.local /root/.local
ENV PATH=/root/.local/bin:$PATH

# Configurar diretorio de trabalho
WORKDIR /app

# Instalar dependencias Node.js
COPY backend/package*.json ./backend/
WORKDIR /app/backend
RUN npm ci --only=production && npm cache clean --force

# Copiar codigo fonte
WORKDIR /app
COPY backend ./backend
COPY python_rag ./python_rag

# Pre-processar cache FAISS (otimizacao)
WORKDIR /app/python_rag
RUN python3 -c "from agente_cpm import carregar_pdfs_cpm; carregar_pdfs_cpm()" 2>/dev/null || echo "Cache sera criado no primeiro uso"

# Voltar ao diretorio do backend
WORKDIR /app/backend

# Expor porta do Railway
EXPOSE 3000

# Variaveis de ambiente
ENV NODE_ENV=production
ENV PYTHONUNBUFFERED=1

# Comando de inicializacao
CMD ["node", "server.js"]