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
```yaml
port: # Port where server listen for requests.
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
```

### Test

#### Auto tests
To run these tests you need the running instance of mongodb. The required configuration of mongodb can be found in `test/config.yaml`, section `mongodb`.
When mongodb is running type in console `npm test`.

#### Manual tests
To see how the server is working you need to run its instance and open `https://localhost:8001/web` to see its web interface.
Do not forget that you may have another port in your config and hence you will need to adjust the port of page url.

To create task type in console `curl -X POST -k https://localhost:8001/application/environment?task=<task>`. You can see the result in the web
interface. Do not forget that you will need these `application`, `environment` and `task` to be present in your pulsar configuration.

There are also the ssl keys that let you browse web interface without notifications of untrusted connection. If you want to do this then:

 * modify your `/etc/hosts` file by adding `127.0.0.1 api.pulsar.local`.
 * install ssl keys onto your OS.

After that you can use `https://api.pulsar.local:8001/` instead of `https://localhost:8001/` without notifications of improper ssl.

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

### WebSocket API
Besides rest and web interface the instance of pulsar-rest-api also offers web socket interface. Interface is available on `{config.baseUrl}/websocket`.
Currently the interface doesn't expect any incoming messages and only transmits events about tasks' lifecycle.

####
Task was created
`{message: {event: 'task.create', task: {Object}}}`

####
Task was changed
`{message: {event: 'task.change', task: {Object}}}`
