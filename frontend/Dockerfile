FROM node:18

WORKDIR /usr/src/
COPY package.json ./
RUN npm install

COPY . .

EXPOSE 3000

RUN npm run build
RUN npm install -g serve

CMD ["npm", "start"]
# CMD [ "serve", "-p", "3000", "build/"]
