# "workspace" is built from the project root, see "pnpm docker-build-workspace" in root package.json
FROM --platform=linux/amd64 workspace
WORKDIR /app
# Don't run production as root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 amplify
USER amplify
# copy built files
COPY --from=workspace --chown=amplify:nodejs /workspace/build/discord-bot ./build
# expose port
EXPOSE 3000
# start the app
CMD pnpm run start