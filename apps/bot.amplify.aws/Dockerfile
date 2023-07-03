FROM node:18-alpine AS base
 
FROM base AS builder
ARG PNPM_VERSION="8.4.0"
RUN apk add --no-cache libc6-compat
RUN apk update
# Set working directory
WORKDIR /workspace
# Install pnpm
RUN corepack enable && \ 
  corepack prepare pnpm@${PNPM_VERSION} --activate
COPY . .
RUN pnpm dlx turbo prune --scope=@aws-amplify/discord-bot-frontend --docker
 
# Add lockfile and package.json's of isolated subworkspace
FROM base AS installer
ARG PNPM_VERSION="8.4.0"
RUN apk add --no-cache libc6-compat
RUN apk update
WORKDIR /workspace
RUN corepack enable && \ 
  corepack prepare pnpm@${PNPM_VERSION} --activate
# First install the dependencies (as they change less often)
COPY --from=builder /workspace/out/json/ .
COPY --from=builder /workspace/out/pnpm-lock.yaml ./pnpm-lock.yaml
RUN pnpm install --frozen-lockfile --silent
# Build the project
COPY --from=builder /workspace/out/full/ .
RUN pnpm turbo run build --filter=@aws-amplify/discord-bot-frontend
 
FROM base AS runner
ARG PNPM_VERSION="8.4.0"
WORKDIR /workspace
# install pnpm
RUN corepack enable && \
  corepack prepare pnpm@${PNPM_VERSION} --activate
# Don't run production as root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 amplifyuser
USER amplifyuser
COPY --from=installer /workspace/apps/bot.amplify.aws/package.json ./
COPY --from=installer --chown=amplifyuser:nodejs /workspace/apps/bot.amplify.aws/build ./apps/bot.amplify.aws/build
COPY --from=installer --chown=nextjs:nodejs /workspace/apps/bot.amplify.aws/public ./apps/bot.amplify.aws/public
CMD pnpm --filter ./apps/bot.amplify.aws run start