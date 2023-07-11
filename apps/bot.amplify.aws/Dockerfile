#syntax=docker/dockerfile:1.4
ARG NODE_VERSION="18.15.0"
ARG ALPINE_VERSION="3.17"
FROM --platform=linux/amd64 node:${NODE_VERSION}-alpine${ALPINE_VERSION} as base

FROM base as pruner
# install deps for turbo (see https://turbo.build/repo/docs/handbook/deploying-with-docker#example)
RUN apk add --no-cache libc6-compat
RUN apk update
# install pnpm with corepack (see https://nodejs.org/api/corepack.html)
RUN corepack enable 
WORKDIR /workspace
COPY . .
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
  pnpm dlx turbo prune --scope="@aws-amplify/discord-bot-frontend" --docker
WORKDIR /workspace/out
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
  pnpm fetch --ignore-scripts

FROM base as builder
RUN apk add --no-cache libc6-compat
RUN apk update
# install pnpm with corepack (see https://nodejs.org/api/corepack.html)
RUN corepack enable
WORKDIR /workspace
# copy base tsconfig (this should probably be moved to a package)
COPY --from=pruner /workspace/tsconfig.json .
# copy pruned lockfile
COPY --from=pruner /workspace/out/pnpm*.yaml .
COPY --from=pruner /workspace/out/full/ .
# copy virtual store (where dependencies are linked to)
COPY --from=pruner /workspace/out/node_modules/ ./node_modules
RUN pnpm install --frozen-lockfile --offline --silent
RUN --mount=type=secret,id=env,required=true,target=/workspace/.env \
  --mount=type=cache,target=/workspace/node_modules/.cache \
  pnpm turbo run build --filter="@aws-amplify/discord-bot-frontend"
# workaround until `pnpm prune` ignores lifecycle scripts
RUN rm -rf node_modules/.pnpm
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store/v3 \
  pnpm fetch --ignore-scripts --prod
# install dependencies required to run the app
RUN pnpm install \
  # ignore prisma/client lifecycle script to regenerate client
  --ignore-scripts \
  # install from pnpm store
  --offline \
  # silence the output
  --silent \
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
COPY --chown=amplifyuser:amplifygroup --from=builder /workspace .
# start the app
CMD pnpm run --filter "@aws-amplify/discord-bot-frontend" start