# Svc Académique — NestJS (SOA)
FROM node:20-alpine AS builder

WORKDIR /app/academic-service

COPY services/academic-service/package.json services/academic-service/package-lock.json ./
RUN npm ci

COPY services/academic-service/ ./
COPY prisma/ ../prisma/

RUN npx prisma generate --schema=../prisma/schema.prisma
RUN npm run build

FROM node:20-alpine AS runner

WORKDIR /app/academic-service

RUN apk add --no-cache openssl

ENV NODE_ENV=production

COPY --from=builder /app/academic-service/node_modules ./node_modules
COPY --from=builder /app/academic-service/dist ./dist
COPY --from=builder /app/prisma ../prisma/
COPY services/academic-service/docker-entrypoint.sh ./docker-entrypoint.sh
RUN sed -i 's/\r$//' docker-entrypoint.sh && chmod +x docker-entrypoint.sh

EXPOSE 3002

ENTRYPOINT ["/bin/sh", "./docker-entrypoint.sh"]
