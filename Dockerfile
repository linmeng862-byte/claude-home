FROM node:22-slim

# 修复 npm 10.x 的 "Exit handler never called" bug
RUN npm install -g npm@latest

WORKDIR /app

# ---- Client ----
COPY client/package.json ./client/

WORKDIR /app/client
RUN npm install --legacy-peer-deps

COPY client/ ./
RUN npm run build

# ---- Server ----
WORKDIR /app
COPY server/package.json ./server/

WORKDIR /app/server
RUN npm install

COPY server/ ./

# ---- Runtime ----
ENV PORT=3001
EXPOSE 3001
CMD ["node", "index.js"]
