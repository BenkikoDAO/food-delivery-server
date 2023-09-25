FROM node:18

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

ENV MONGO_CONNECTION_URL=$MONGO_CONNECTION_URL

ENV PORT=5000

EXPOSE 5000

CMD ["npm", "start"]