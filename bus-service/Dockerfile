# Build context: raíz del repositorio
#   docker build -f bus-service/Dockerfile .

# STAGE 1: Build
FROM node:20-slim AS builder

RUN apt-get update && apt-get install -y ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY bus-service/package*.json ./
RUN npm install

COPY bus-service/ .
RUN npm run build

# STAGE 2: Runtime
FROM node:20-slim AS runtime

RUN apt-get update && apt-get install -y ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY bus-service/package*.json ./

EXPOSE 3007

CMD ["node", "dist/server.js"]
