FROM node:20-alpine AS builder

WORKDIR /app/notification-service

COPY services/notification-service/package.json services/notification-service/package-lock.json* ./
RUN npm install

COPY services/notification-service/ ./
COPY prisma/ ../prisma/

RUN npx prisma generate --schema=../prisma/schema.prisma
RUN npm run build

FROM node:20-alpine AS runner

WORKDIR /app/notification-service

RUN apk add --no-cache openssl

ENV NODE_ENV=production

COPY --from=builder /app/notification-service/node_modules ./node_modules
COPY --from=builder /app/notification-service/dist ./dist
COPY --from=builder /app/prisma ../prisma/

EXPOSE 3004

CMD ["node", "dist/main.js"]
