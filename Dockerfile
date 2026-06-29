FROM node:22-slim

WORKDIR /app

# ---- Client: 先复制依赖描述文件，利用 Docker 缓存 ----
COPY client/package.json client/package-lock.json ./client/

WORKDIR /app/client
RUN npm install

# 再复制源码并构建
COPY client/ ./
RUN npm run build

# ---- Server ----
WORKDIR /app
COPY server/package.json server/package-lock.json ./server/

WORKDIR /app/server
RUN npm install

COPY server/ ./

# ---- Runtime ----
ENV PORT=3001
EXPOSE 3001
CMD ["node", "index.js"]
