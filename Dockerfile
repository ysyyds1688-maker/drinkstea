FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ENV VITE_API_BASE_URL=https://backenddrinktea.zeabur.app
RUN npm run build

FROM node:20-alpine
RUN npm install -g serve@14
WORKDIR /app
COPY --from=build /app/dist ./dist
ENV PORT=8080
EXPOSE 8080
CMD ["serve", "-s", "dist", "-l", "8080"]
