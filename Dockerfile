FROM node:20.11.0-alpine3.19

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npx prisma generate
RUN npm run build

EXPOSE 3000

ENV NODE_ENV=production

CMD ["npm", "run", "docker-start"]