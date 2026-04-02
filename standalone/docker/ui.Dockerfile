FROM node:20-alpine AS builder

WORKDIR /app/standalone/ui
COPY standalone/ui/package*.json ./
RUN npm install && ln -s /app/standalone/ui/node_modules /app/node_modules

COPY standalone/ui/ .
COPY shared/ui/ ../../shared/ui/
RUN npm run build

FROM nginx:alpine
COPY standalone/docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/standalone/ui/dist /usr/share/nginx/html
EXPOSE 80
