FROM node:22-slim

WORKDIR /app

COPY client ./client

WORKDIR /app/client

RUN node -v
RUN npm -v
RUN npm install
RUN ls -la node_modules/.bin
RUN npm run build

WORKDIR /app

COPY server ./server

WORKDIR /app/server

RUN npm install

ENV PORT=3001

EXPOSE 3001

CMD ["node", "index.js"]
