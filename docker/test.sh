#!/bin/bash -e

function app_wait_mongodb {
  TIMEOUT=${2:-300}
  echo "Waiting for MongoDB service..."
  count=0
  until ( test_mongo )
  do
    let "count=+1"
    if [ ${count} -gt $TIMEOUT ]
    then
      echo "MongoDB service didn't become ready in time"
      return 100
    fi
    sleep 1
    printf "\n"
  done
  printf "\n"
  echo "MongoDB service is ready!"
  return 0
}

function test_mongo {
  curl "http://mongo:27017" &>/dev/null
}

app_wait_mongodb
npm test
