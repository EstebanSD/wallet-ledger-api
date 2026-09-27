# Imagen de desarrollo. No es la imagen de producción (esa se define
# cuando el proyecto llegue a esa etapa — multi-stage build con
# `nest build` + `node dist/main` y sin devDependencies).
# FROM node:20-alpine

# WORKDIR /usr/src/app

# Copiamos solo los manifests primero para aprovechar la cache de capas
# de Docker: si no cambian package.json/lock, no se re-corre npm install
# aunque cambie el código fuente.
# COPY package*.json ./

# RUN npm install

# El resto del código llega por bind mount en docker-compose (volumes),
# así que este COPY solo importa para builds que no usan el compose.
# COPY . .

# EXPOSE 3000

# CMD ["npm", "run", "start:dev"]