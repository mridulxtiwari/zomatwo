# ==============================================================
# Multi-stage Dockerfile for Zomatwo React Frontend
# ==============================================================
FROM node:20-alpine AS builder
WORKDIR /app

# Install dependencies first for Docker layer caching
COPY package.json package-lock.json ./
RUN npm ci

# Copy source code and build production bundle
COPY . .
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
RUN npm run build

# ==============================================================
# Production Nginx Web Server
# ==============================================================
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
