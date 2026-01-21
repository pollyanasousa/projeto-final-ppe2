FROM node:18-alpine

# Dependências de sistema
RUN apk add --no-cache \
    python3 \
    py3-pip \
    make \
    g++ \
    && python3 -m venv /opt/venv

# Ativa o venv
ENV PATH="/opt/venv/bin:$PATH"

WORKDIR /app

# Node
COPY package*.json ./
RUN if [ -f package-lock.json ]; then \
      npm ci --omit=dev; \
    else \
      npm install --omit=dev; \
    fi && npm cache clean --force

# Python
COPY python_rag/requirements.txt ./python_rag/
RUN pip install --no-cache-dir -r python_rag/requirements.txt

COPY . .

CMD ["node", "index.js"]
