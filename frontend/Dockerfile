FROM node:22-alpine

WORKDIR /app

COPY frontend/package.json .
COPY frontend/pnpm-lock.yaml .

RUN corepack enable
RUN pnpm install

COPY frontend .

CMD ["pnpm", "dev", "--hostname", "0.0.0.0"]
