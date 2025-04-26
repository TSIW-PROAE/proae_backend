FROM node:23-alpine as builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN mkdir -p /app/uploads && chmod -R 777 /app/uploads
RUN npm run build

FROM node:23-alpine
WORKDIR /app
USER node
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/uploads ./uploads
USER root
RUN chown -R node:node /app/uploads
USER node
EXPOSE 3000
CMD ["node", "dist/main"]
