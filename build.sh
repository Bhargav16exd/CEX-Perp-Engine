#!/bin/bash

npm run build
echo "Building TS Build"

docker build -t cex-perp-eng .
echo "Docker Image Build"

