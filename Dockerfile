FROM node:23-alpine as builder

WORKDIR /app

# Instalar TODAS as dependências (incluindo dev) para fazer o build
COPY package*.json ./
RUN npm ci && npm cache clean --force

# Copiar código e fazer build
COPY . .
RUN npm run build

# Stage de produção
FROM node:23-alpine

WORKDIR /app

RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    && rm -rf /var/cache/apk/*

# Copiar apenas arquivos necessários para produção
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./

# Instalar apenas dependências de produção no stage final
RUN npm ci --only=production && npm cache clean --force

ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

USER node

CMD ["node", "dist/main"]
