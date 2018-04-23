#!/bin/bash

docker build -t antontimiskov/node-task-scheduler:1.0.2-k8s-2 -f ./Dockerfile .
# docker build -t antontimiskov/node-task-scheduler:1.0.2-k8s-tests -f ./Dockerfile-tests  .
