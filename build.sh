#!/bin/bash

docker build -t antontimiskov/node-task-scheduler:1.0.0 -f ./Dockerfile .
docker build -t antontimiskov/node-task-scheduler:1.0.0-tests -f ./Dockerfile-tests  .
