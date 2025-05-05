#!/bin/bash
set -e

if [ -z "$IMAGE_NAME" ]; then
  echo "You must set IMAGE_NAME, e.g.: export IMAGE_NAME=yourname/yourrepo:tag"
  exit 1
fi

echo "Building Docker image: $IMAGE_NAME"
docker build -t "$IMAGE_NAME" .

if [ -n "$DOCKER_USER" ] && [ -n "$DOCKER_PASS" ]; then
  echo "Running docker login"
  echo "$DOCKER_PASS" | docker login ghcr.io --username "$DOCKER_USER" --password-stdin
fi

echo "Pushing image $IMAGE_NAME"
docker push "$IMAGE_NAME"

echo "Done!" 
