#!/bin/bash

git fetch origin main
git reset --hard origin/main
git clean -fd
docker compose up -d --build
docker image prune -f