FROM node:20
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY . .
RUN touch ./prisma/dev.db
RUN npm run prisma:migrate
RUN npm run build
EXPOSE 3000
CMD ["node", "server/entry.fastify"]
