#!/usr/bin/env bash
APPNAME=vivacoronia
npm run precommit && \
docker pull node:14 && \
docker build . -f ./docker/Dockerfile.heroku -t registry.heroku.com/${APPNAME}/web && \
heroku container:login && \
docker push registry.heroku.com/${APPNAME}/web && \
heroku container:release web -a ${APPNAME}
