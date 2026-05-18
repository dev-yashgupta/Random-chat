# ── Stage 1: Build client ────────────────────────────────────────────────────
FROM node:18-alpine AS client-build
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

# ── Stage 2: Build server ────────────────────────────────────────────────────
FROM node:18-alpine AS server-build
WORKDIR /app/server
COPY server/package*.json ./
RUN npm ci
COPY server/ ./
RUN npm run build

# ── Stage 3: Production image ────────────────────────────────────────────────
FROM node:18-alpine
WORKDIR /app

# Server runtime deps + compiled output
COPY --from=server-build /app/server/dist ./server/dist
COPY --from=server-build /app/server/package*.json ./server/
RUN cd server && npm ci --omit=dev

# Built client — served as static files by the server
COPY --from=client-build /app/client/dist ./client/dist

EXPOSE 3001
ENV NODE_ENV=production

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3001/api/health || exit 1

CMD ["node", "server/dist/index.js"]
