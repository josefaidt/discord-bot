#syntax=docker/dockerfile:1.4
ARG NODE_VERSION="18.15.0"
ARG ALPINE_VERSION="3.17"
FROM --platform=linux/amd64 node:${NODE_VERSION}-alpine${ALPINE_VERSION} as pnpm-builder
ARG PNPM_VERSION="8.4.0"
# for turbo - https://turbo.build/repo/docs/handbook/deploying-with-docker#example
RUN apk add --no-cache libc6-compat
RUN apk update
WORKDIR /workspace
# Install pnpm
RUN corepack enable && \ 
  corepack prepare pnpm@${PNPM_VERSION} --activate
# pnpm fetch only requires lockfile, but we'll need to build workspaces
COPY pnpm*.yaml ./
COPY patches ./patches
# mount pnpm store as cache & fetch dependencies
RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm-store \
  pnpm fetch

# build workspace
FROM pnpm-builder AS workspace
WORKDIR /workspace
ENV CI=true
# add project source to build
COPY . ./
# mount .env file
RUN --mount=type=secret,id=env,required=true,target=/workspace/.env \
  pnpm install --frozen-lockfile --offline --silent

# @todo remove in favor of mounting .env?
# expose arguments for VITE environment variables
ARG VITE_HOST=http://localhost:3000
ARG VITE_NEXTAUTH_URL=http://localhost:3000
ARG VITE_DISCORD_GUILD_ID=976838371383083068

# run build
RUN --mount=type=secret,id=env,required=true,target=/workspace/.env \
  pnpm run build
# RUN pnpm run build
# deploy app
RUN pnpm --filter ./apps/bot.amplify.aws deploy --prod ./build/bot.amplify.aws
# deploy bot
RUN pnpm --filter ./apps/discord-bot deploy --prod ./build/discord-bot