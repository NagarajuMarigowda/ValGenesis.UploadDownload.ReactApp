FROM node:16.13.1-alpine
# FROM node:16.13.1 as build
WORKDIR /app
ENV PATH /app/node_modules/.bin:$PATH
COPY package.json ./
COPY package-lock.json ./
RUN npm install --silent
# RUN npm install react-scripts@5.0.1 -g --silent
COPY . ./
# RUN npm run build
CMD ["npm", "start"]