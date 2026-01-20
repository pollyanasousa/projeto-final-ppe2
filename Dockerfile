# Usar imagem Node.js com Python
FROM node:18

# Instalar Python e dependências do sistema
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    && rm -rf /var/lib/apt/lists/*

# Criar link simbólico
RUN ln -s /usr/bin/python3 /usr/bin/python

# Definir diretório de trabalho
WORKDIR /app

# Copiar requirements.txt e instalar dependências Python
COPY python_rag/requirements.txt ./python_rag/requirements.txt
RUN pip3 install --no-cache-dir -r ./python_rag/requirements.txt

# Copiar package.json do backend e instalar dependências Node
COPY backend/package*.json ./backend/
WORKDIR /app/backend
RUN npm install

# Voltar para raiz e copiar todo o código
WORKDIR /app
COPY . .

# Configurar diretório de trabalho final
WORKDIR /app/backend

# Expor porta
EXPOSE 3000

# Comando para iniciar
CMD ["node", "server.js"]