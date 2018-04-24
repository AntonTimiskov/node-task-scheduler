#!/bin/bash 

PORT=8082
NAME=fitnesse_node_task_scheduler

docker rm -f $NAME 2> /dev/null

docker run -d \
    -v $(pwd)/tests/AT/FitNesseRoot:/FitNesseRoot \
    -v $(pwd)/tests/AT/fixtures:/FitNesseRoot/Scripts \
    --name=$NAME \
    -p $PORT:8081 \
    mikeplavsky/docker-waferslim
