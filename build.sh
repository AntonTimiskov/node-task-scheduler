#!/bin/bash

docker build -t antontimiskov/node-task-scheduler:1.0.7-k8s -f ./Dockerfile .
docker build -t antontimiskov/node-task-scheduler:1.0.7-k8s-tests -f ./Dockerfile-tests  .
