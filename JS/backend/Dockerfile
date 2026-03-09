FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm install -g ts-node typescript

EXPOSE 5000

CMD ["sh", "-c", "trap 'echo Arrêt backend détecté; exit' SIGINT SIGTERM; npx ts-node server.ts"]
