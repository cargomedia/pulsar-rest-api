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
You can run pulsar-rest-api using default arguments or specify them on your own.

`--config-repo` Specify pulsar configuration repository.

`--conf-branch` Specify branch for pulsar configuration repository (default set to `master`).

`--port` Specify port where server listen for requests (default set to `80801`).

`--log-dir` Directory where log is stored. Script will try to create directory if needed. Defaults to `null` which means it will output to stdout.

`--ssl-key` Specify ssl private key file. Combine with `ssl-cert` option.

`--ssl-cert` Specify ssl public certificate file. Combine with `ssl-key` option. Append CA-chain within this file.

`--ssl-pfx` Specify ssl pfx file (key + cert). Overrides `ssl-key` and `ssl-cert` options.

`--ssl-passphrase` Specify file containing the ssl passphrase.

`--auth-username` Specify username for authorisation provider.

`--auth-password` Specify password for authorisation provider.

`--auth-provider` Specify authorisation provider (default set to `github`).

`--auth-method` Specify authorisation method (default set to `user`).

## Development

### Run

By default server listens on port `8001` in SSL mode with certificates for domain `*.pulsar.local`. SSL certs are stored in `bin/ssl/*`.

### Test

For testing please modify your `/etc/hosts` file by adding `127.0.0.1 api.pulsar.local`.

Run in console `curl -k https://api.pulsar.local:8001/application/environment/task`.


### API documentation

`:app` - application name (e.g. foobar)

`:env` - environment name (e.g. production)

`:action` - pulsar action/task

`:id` - task ID

#### Create Task

##### Request:
`POST /:app/:env` with parameter `action` name passed to pulsar

##### Response on success:
HTTP response code `200`
```json
{
 "taskId": "new task ID"
}
```

#### Get task data

Immediately returns all task data including output to date.

##### Request:
`GET /task/:id`

##### Response on success:
HTTP response code `200`
```json
{
  "id": 47,
  "status": "failed",
  "app": "fuboo",
  "env": "production",
  "action": "shell",
  "exitCode": null,
  "output": "[output goes here]",
  "pid": 48691
}
```

#### Observe task changes (for long pooling)

This listens for any task state changes (e.g. new output) and when it happens returns full task data is returned. If state is 'running' the client
should re-connect to this method in order to wait for new data. This methods timeouts each 30s after which it should be called again. (this may change in the near future).

##### Request:
`GET /task/:id/state`

##### Response on success:
Task changed before server timeout.
HTTP response code `200`
```json
{
  "changed": true,
  "task": {
     "id":47,
     "status":"failed",
     "app":"fuboo",
     "env":"production",
     "action":"shell",
     "exitCode":null,
     "output":"[output goes here]",
     "pid":48691
  }
}
```

##### Response on timeout:
Task not changed before the timeout
HTTP response code `200`
```json
{
  "changed": false
}
```

In that case you should immediately create next request.

#### Kill task

##### Request
`GET /task/:id/kill`

##### Response
HTTP response code `200`
