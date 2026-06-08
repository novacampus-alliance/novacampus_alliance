FROM node:20-alpine AS builder

WORKDIR /app/gateway

COPY services/gateway/package.json services/gateway/package-lock.json* ./
RUN npm install

COPY services/gateway/ ./
RUN npm run build

FROM node:20-alpine AS runner

WORKDIR /app/gateway

ENV NODE_ENV=production

COPY --from=builder /app/gateway/package.json ./
COPY --from=builder /app/gateway/node_modules ./node_modules
COPY --from=builder /app/gateway/dist ./dist

EXPOSE 3001

CMD ["node", "dist/src/main.js"]
