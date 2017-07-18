#!/bin/bash -e
docker-compose up --abort-on-container-exit --exit-code-from pulsar pulsar
