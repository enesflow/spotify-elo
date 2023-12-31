FROM node:20
WORKDIR /usr/src/app
COPY package*.json ./
# RUN npm install
RUN npm install -g pnpm
RUN pnpm install
COPY . .
RUN npm run prisma:generate
RUN npm run build
EXPOSE 3000
CMD ["node", "server/entry.fastify"]
