FROM python:3.11-slim

WORKDIR /app

# Instala dependencias do sistema necessarias para o psycopg2
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

# Copia o codigo da aplicacao
COPY . .

EXPOSE 8000

# Executa o uvicorn com hot-reloading
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
