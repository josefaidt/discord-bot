#syntax=docker/dockerfile:1.4
ARG NODE_VERSION="18.15.0"
ARG ALPINE_VERSION="3.17"
FROM --platform=linux/amd64 node:${NODE_VERSION}-alpine${ALPINE_VERSION} as base

FROM base as installer
# install deps for turbo (see https://turbo.build/repo/docs/handbook/deploying-with-docker#example)
RUN apk add --no-cache libc6-compat
RUN apk update
# install pnpm with corepack (see https://nodejs.org/api/corepack.html)
RUN corepack enable 
# set workspace directory
WORKDIR /workspace
# pnpm fetch only requires lockfile, but we'll need to build workspaces
COPY pnpm-lock.yaml ./
COPY patches ./patches
# copy other required files that do not change often
COPY tsconfig.json ./tsconfig.json
# COPY .gitignore ./.gitignore
# mount pnpm store as cache & fetch dependencies
RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store/v3 \
  pnpm fetch --ignore-scripts
# RUN pnpm dlx turbo prune --scope="@aws-amplify/discord-bot-frontend" --docker

FROM installer as pruner
COPY . .
RUN pnpm dlx turbo prune --scope="@aws-amplify/discord-bot-frontend" --docker

# build workspace
FROM installer AS builder
WORKDIR /workspace
# force `pnpm install` to run with `--frozen-lockfile`
ENV CI=true
ARG APP="bot.amplify.aws"
# add project source to build
COPY --from=pruner /workspace/out/full .
# # mount .env file and install (mounting dotenv will help with sveltekit's `sync`)
RUN --mount=type=secret,id=env,required=true,target=/workspace/.env \
  pnpm install --offline --silent
# run build
RUN --mount=type=secret,id=env,required=true,target=/workspace/.env \
  pnpm turbo run build --filter="@aws-amplify/discord-bot-frontend"
# workaround until `pnpm prune` ignores lifecycle scripts
RUN rm -rf node_modules/.pnpm
RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store/v3 \
  pnpm fetch --ignore-scripts --prod
# install dependencies required to run the app
RUN pnpm install \
  # ignore prisma/client lifecycle script to regenerate client
  --ignore-scripts \
  # install from pnpm store
  --offline \
  # silence the output
  --silent \
#   # set virtual store relative to workspace app (this fails because we're recreating the virtual store that is already populated by `pnpm fetch`)
#   # --virtual-store-dir ./apps/bot.amplify.aws/node_modules/.pnpm \
  # install only dependencies required to run the app
  --prod

FROM --platform=linux/amd64 node:${NODE_VERSION}-alpine${ALPINE_VERSION} as runner
WORKDIR /workspace
# install pnpm
RUN corepack enable
# Don't run production as root
RUN addgroup --system --gid 1001 amplifygroup
RUN adduser --system --uid 1001 amplifyuser
USER amplifyuser
# copy virtual store (where dependencies are linked to)
COPY --chown=amplifyuser:amplifygroup --from=builder /workspace/node_modules ./node_modules
# copy apps files
COPY --chown=amplifyuser:amplifygroup --from=builder /workspace/apps/bot.amplify.aws ./apps/bot.amplify.aws
# copy prisma-client package (required so prisma can find the schema file)
COPY --chown=amplifyuser:amplifygroup --from=builder /workspace/packages/prisma-client ./packages/prisma-client
# start the app
CMD pnpm --dir ./apps/bot.amplify.aws run start