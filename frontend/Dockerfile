FROM node:22-alpine

WORKDIR /app

RUN corepack enable

COPY package.json .
COPY pnpm-lock.yaml .

RUN corepack enable
RUN corepack prepare pnpm@10.17.1 --activate

RUN pnpm install

COPY . .

CMD ["pnpm", "dev", "--hostname", "0.0.0.0"]
