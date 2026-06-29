FROM node:20-slim

WORKDIR /app

# ---- 1. Copy & install client ----
COPY client/package.json client/package-lock.json ./client/
COPY client/ ./client/
RUN cd client && npm install && npm run build

# ---- 2. Copy & install server ----
COPY server/package.json server/package-lock.json ./server/
COPY server/ ./server/
RUN cd server && npm install

# ---- 3. Runtime ----
ENV PORT=3001
EXPOSE 3001

WORKDIR /app/server
CMD ["node", "index.js"]
