FROM node:20
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
RUN touch ./prisma/dev.db
COPY . .
RUN npm run prisma:migrate
RUN npm run build
EXPOSE 3000
CMD ["node", "server/entry.express"]
