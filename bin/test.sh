#!/bin/bash -e
npm install
node test/runner.js "$@"
