#!/usr/bin/env bash
APPNAME=vivacoronia
docker build . -f ./docker/Dockerfile.prod -t registry.heroku.com/${APPNAME}/web
heroku container:login
docker push registry.heroku.com/${APPNAME}/web
heroku container:release web -a ${APPNAME}
