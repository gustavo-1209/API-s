# STAGE 1: Build
FROM node:20-slim AS builder

RUN apt-get update && apt-get install -y openssl libssl-dev ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm install
RUN npx prisma generate

COPY . .
RUN npm run build

# STAGE 2: Runtime
FROM node:20-slim AS runtime

RUN apt-get update && apt-get install -y openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY package*.json ./

EXPOSE 3005

CMD ["node", "dist/server.js"]