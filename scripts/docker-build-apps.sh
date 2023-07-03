#!/bin/bash

docker buildx build \
  --secret id=env,src=.env \
  --file ./apps/bot.amplify.aws/Dockerfile \
  ./
  # ./apps/bot.amplify.aws
  # --output type=tar,dest=build/discord-bot-frontend.tar \

# docker buildx build \
#   --secret id=env,src=.env \
#   ./apps/discord-bot
  # --output type=tar,dest=build/discord-bot.tar \