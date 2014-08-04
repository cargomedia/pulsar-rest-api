[![Build Status](https://travis-ci.org/cargomedia/pulsar-rest-api.png?branch=master)](https://travis-ci.org/cargomedia/pulsar-rest-api)

(unstable, currently in development)

pulsar-rest-api
===============

## About
HTTP REST API for executing [pulsar](https://github.com/nebulab/pulsar) tasks.

## Server

### Installation
Package is in nodejs and is available through npm registry:
```
npm install pulsar-rest-api [-g]
```

### Running
The instance of pulsar-rest-api can be run with different parameters. All of the parameters can be specified in the config. To run the instance with
your own config you need to specify the filepath to it with the flag `-c`. For example `pulsar-rest-api -c '~/my_pulsar_config.yaml'`.

The default config is [`config.yaml`](bin/config.yaml) and it can be found in `bin` directory of the pulsar-rest-api installation.

The format of the config is:
````
default:
  port: # Port where server listen for requests.
  log: #
    dir: # Directory where the log file goes. Script will try to create it if needed.
    name: # Name of the log file. If it can't be created or it is Null value then output goes to stdout.
  auth:
    github-oauth-id: # Github oauth `id`.
    github-oauth-secret: # Github oauth `secret`.
  mongodb:# mongoDB connection parameters
    host: # hostname
    port: # port
    db: # database name
  pulsar:
    repo: # Pulsar configuration repository.
    branch: # Branch for pulsar configuration repository.
  ssl:
    key: # Ssl private key file. Combine with `ssl-cert` option.
    cert: # Ssl public certificate file. Combine with `ssl-key` option. Append CA-chain within this file.
    pfx: #Ssl pfx file (key + cert). Overrides `ssl-key` and `ssl-cert` options.
    passphrase: # File containing the ssl passphrase.
````

### Test

For testing please modify your `/etc/hosts` file by adding `127.0.0.1 api.pulsar.local`.

Run in console `curl -k https://api.pulsar.local:8001/application/environment/task`.


## API documentation

`:app` - application name (e.g. foobar)

`:env` - environment name (e.g. production)

`:action` - pulsar action/task

`:id` - task ID

### Get tasks list

#### Request:
`GET /tasks`

#### Response on success:
HTTP response code `200`
```json
{
  "url": "http://api.pulsar.local:8001/pulsar/index.html",
  "tasks": {
    "task-id-1" : "{Object}",
    "task-id-n" : "{Object}"
  }
}
```

#### Response on timeout:
No new task created before the timeout
HTTP response code `200`
```json
{
  "changed": false
}
```


### Create Task

#### Request:
```
POST /:app/:env?task=:task
```

Optionally use the blocking behaviour:
```
POST /:app/:env?action=:action&wait=true
```

#### Response on success:
HTTP response code `200`
```json
{
  "id": "123",
  "url": "https://api.pulsar.local:8001/web/task/532c3240f8214f0000177376"
}
```

In case of a blocking execution the task's data will be returned:
```json
{
  "id": 123,
  "url": "https://api.pulsar.local:8001/web/task/532c3240f8214f0000177376",
  "data": {
    "id": 123,
    "status": "failed",
    "app": "fuboo",
    "env": "production",
    "action": "shell",
    "exitCode": null,
    "output": "Here comes the output",
    "pid": 48691
  }
}
```

### Get task data

Immediately returns all task data including output to date.

#### Request:
`GET /task/:id`

#### Response on success:
HTTP response code `200`
```json
{
  "id": 123,
  "status": "failed",
  "app": "fuboo",
  "env": "production",
  "action": "shell",
  "exitCode": null,
  "output": "Here comes the output",
  "pid": 48691
}
```

### Kill task

#### Request
`GET /task/:id/kill`

#### Response
HTTP response code `200`
