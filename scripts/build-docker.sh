#!/bin/bash

for app in apps/*/ ; do
  echo "building $app"
  version=$(cat package.json | jq -r '.version')
  app_name=$(cat $app/package.json | jq -r '.name')
  image_name=${app_name#@}
  docker buildx build \
    --build-arg APP_NAME="$app_name" \
    --secret id=env,src=.env \
    --file ./Dockerfile \
    --cache-from $image_name:latest \
    --tag $image_name:latest \
    --tag $image_name:$version \
    .
done