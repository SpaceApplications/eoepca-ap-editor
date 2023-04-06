# build stage
FROM node:14-buster as build-stage
WORKDIR /app
COPY frontend/package*.json frontend/yarn.lock ./
RUN yarn install
COPY frontend ./
RUN yarn run build

# production stage
FROM python:3.12-rc-slim as production-stage
RUN apt-get -y update && apt-get -y install nginx
COPY server.conf /etc/nginx/sites-available/default
COPY --from=build-stage /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
