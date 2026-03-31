FROM node:20-alpine AS builder

WORKDIR /app/ui
COPY standalone/ui/package*.json ./
RUN npm install

COPY standalone/ui/ .
RUN npm run build

FROM nginx:alpine
COPY standalone/docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/ui/dist /usr/share/nginx/html
EXPOSE 80
