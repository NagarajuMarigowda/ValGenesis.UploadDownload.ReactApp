FROM node:16.13.1-alpine AS build
WORKDIR /
COPY package.json package-lock.json ./
COPY .npmrc ./
RUN npm ci --omit=dev
RUN rm -f .npmrc
COPY . ./
RUN npm run build:webpack

FROM nginx:alpine
COPY --from=build /dist/ /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 9000 80
ENTRYPOINT ["nginx", "-g", "daemon off;"]
