FROM node:20-alpine AS builder

WORKDIR /app/billing-service

COPY services/billing-service/package.json services/billing-service/package-lock.json* ./
RUN npm install

COPY services/billing-service/ ./
COPY prisma/ ../prisma/

RUN npx prisma generate --schema=../prisma/schema.prisma
RUN npm run build

FROM node:20-alpine AS runner

WORKDIR /app/billing-service

RUN apk add --no-cache openssl

ENV NODE_ENV=production

COPY --from=builder /app/billing-service/node_modules ./node_modules
COPY --from=builder /app/billing-service/dist ./dist
COPY --from=builder /app/prisma ../prisma/
COPY services/billing-service/docker-entrypoint.sh ./docker-entrypoint.sh
RUN sed -i 's/\r$//' docker-entrypoint.sh && chmod +x docker-entrypoint.sh

EXPOSE 3003

ENTRYPOINT ["/bin/sh", "./docker-entrypoint.sh"]
