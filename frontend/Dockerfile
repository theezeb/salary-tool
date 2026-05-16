# --- STAGE 1: Build the Static Assets ---
FROM node:20-alpine AS builder
WORKDIR /app

# Cache dependencies
COPY package*.json ./
RUN npm ci

# Copy code and build production bundle
COPY . .
RUN npm run build

# --- STAGE 2: Serve the Static Assets ---
FROM node:20-alpine
WORKDIR /app

# Install a lightweight static file server
RUN npm install -g serve

# Pull only the compiled 'dist' files from the builder stage
COPY --from=builder /app/dist ./dist

EXPOSE 3000

# Serve the files with single-page-app routing enabled (--single)
CMD ["sh", "-c", "serve dist -l ${PORT:-3000} --single"]