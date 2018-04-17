#!/bin/bash

docker build -t antontimiskov/node-task-scheduler:1.0.1 -f ./Dockerfile .
docker build -t antontimiskov/node-task-scheduler:1.0.1-tests -f ./Dockerfile-tests  .
