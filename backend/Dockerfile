FROM node:20-slim AS deps

RUN apt-get update -y && apt-get install -y openssl libc6

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY prisma/schema.prisma ./prisma/schema.prisma
RUN npm run db:generate

FROM node:20-slim as build

WORKDIR /app

COPY package.json ./
COPY tsconfig.json ./
COPY --from=deps /app/node_modules ./node_modules
COPY src ./src

RUN npm run build

FROM node:20-slim as dev

RUN apt-get update -y && apt-get install -y openssl libc6

ENV NODE_ENV development

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules

COPY package.json ./

CMD ["sh", "-c", "npm run dev"]