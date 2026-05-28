FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
COPY apps/order/package*.json apps/order/
COPY apps/notification/package*.json apps/notification/
COPY apps/iam-service/package*.json apps/iam-service/
RUN npm install

COPY . .

CMD ["npm", "run", "dev:fulfillment"]
