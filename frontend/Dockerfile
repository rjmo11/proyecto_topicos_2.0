# --- Stage 1: Build (Construcción) ---
FROM node:18-slim AS build
WORKDIR /app
COPY package*.json ./
# Install all dependencies (npm ci respects package-lock.json)
RUN npm ci && \
    echo "Verifying vite installation..." && \
    ./node_modules/.bin/vite --version
COPY . .
RUN npm run build

# --- Stage 2: Serve (Servir) ---
FROM nginx:alpine
# Copiar la build de React al directorio web de Nginx
COPY --from=build /app/dist /usr/share/nginx/html
# Copiar config de nginx si es necesaria (opcional pero recomendado)
# COPY nginx.conf /etc/nginx/conf.d/default.conf 
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]