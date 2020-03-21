FROM node:alpine
WORKDIR /usr/scr/app
COPY . .
RUN npm install
COPY . .
EXPOSE 8080
CMD ["npm", "start"]