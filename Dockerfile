FROM node:alpine

WORKDIR /tutorsonhenry

COPY . .

RUN npm install

EXPOSE 3001

CMD [ "node", "server.js" ]