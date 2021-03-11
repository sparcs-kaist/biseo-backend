FROM node:14-alpine AS builder
WORKDIR /usr/src/app
RUN apk add --no-cache git
COPY package* ./
RUN npm install
COPY . .
RUN npm run build

FROM node:14-alpine
WORKDIR /usr/src/app
COPY --from=builder /usr/src/app/dist dist
COPY tsconfig.json tsconfig-paths-bootstrap.js package* ./
RUN npm install --production
EXPOSE 3000
CMD PORT=3000 npm run prod
