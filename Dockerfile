FROM node:22-slim

# 修复 npm 10.x 的 "Exit handler neverCalled" bug
RUN npm install -g npm@latest

WORKDIR /app

# ---- Client ----
# 在 COPY 之前加 ARG 破坏 Docker 缓存，确保每次 push 都重新构建
ARG BUILD_DATE=default
RUN echo "Build: ${BUILD_DATE}"
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

# 健康检查：确认 dist 和 node_modules 存在
RUN ls -la /app/client/dist/ && echo "✅ client/dist OK" && ls -la /app/server/node_modules/ && echo "✅ server/node_modules OK"

WORKDIR /app/server
CMD ["node", "index.js"]
