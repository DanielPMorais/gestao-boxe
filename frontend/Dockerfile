FROM node:20-alpine

WORKDIR /app

# Copia os arquivos de dependencia
COPY package.json package-lock.json* ./

RUN npm install

# Copia o restante dos arquivos do codigo
COPY . .

EXPOSE 5173

# Vite padrao exige "--host" para expor fora do container
CMD ["npm", "run", "dev", "--", "--host"]
