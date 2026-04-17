# Build stage
FROM node:20-alpine AS build

WORKDIR /app

ENV NODE_ENV=development

COPY package*.json ./
RUN npm install --no-audit --no-fund --prefer-offline

COPY . .
RUN NODE_ENV=production npm run build

# Production stage — nginx serves the built app
FROM nginx:1.25-alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
