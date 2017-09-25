#!/bin/bash -e

wait-for-it mongodb:27017
npm install
npm test
