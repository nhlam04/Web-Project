FROM node:20-alpine AS build

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
ARG REACT_APP_ORDERING_URL=/api/ordering
ARG REACT_APP_CATALOG_URL=/api/catalog
ENV REACT_APP_ORDERING_URL=$REACT_APP_ORDERING_URL
ENV REACT_APP_CATALOG_URL=$REACT_APP_CATALOG_URL
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
