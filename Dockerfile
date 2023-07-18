#syntax=docker/dockerfile:1.4
ARG NODE_VERSION="18.15.0"
ARG ALPINE_VERSION="3.17"
FROM --platform=linux/amd64 node:${NODE_VERSION}-alpine${ALPINE_VERSION} as base
# for turbo - https://turbo.build/repo/docs/handbook/deploying-with-docker#example
RUN apk add --no-cache libc6-compat
RUN apk update
WORKDIR /workspace
# enable corepack for pnpm
RUN corepack enable

FROM base as fetcher
# pnpm fetch only requires lockfile, but we'll need to build workspaces
COPY pnpm*.yaml ./
COPY patches ./patches
# mount pnpm store as cache & fetch dependencies
RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm-store \
  pnpm fetch --ignore-scripts

FROM fetcher as builder
ARG APP_NAME="@aws-amplify/discord-bot"
ENV APP_NAME=${APP_NAME}
WORKDIR /workspace
COPY . .
RUN --mount=type=secret,id=env,required=true,target=/workspace/.env \
  pnpm install --frozen-lockfile --offline --loglevel=error
# build app
RUN --mount=type=secret,id=env,required=true,target=/workspace/.env \
  --mount=type=cache,target=/workspace/node_modules/.cache \
  pnpm turbo run build --filter="${APP_NAME}"

FROM builder as deployer
WORKDIR /workspace
# deploy app
RUN pnpm --filter ${APP_NAME} deploy --prod --ignore-scripts ./out

FROM base as runner
WORKDIR /workspace
# Don't run production as root
RUN addgroup --system --gid 1001 amplifygroup
RUN adduser --system --uid 1001 amplifyuser
USER amplifyuser
# copy files needed to run the app
COPY --chown=amplifyuser:amplifygroup --from=deployer /workspace/out/package.json .
COPY --chown=amplifyuser:amplifygroup --from=deployer /workspace/out/node_modules/ ./node_modules
COPY --chown=amplifyuser:amplifygroup --from=deployer /workspace/out/build/ ./build
# start the app
CMD pnpm run start