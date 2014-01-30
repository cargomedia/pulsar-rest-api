[![Build Status](https://travis-ci.org/kris-lab/pulsar-rest-api.png?branch=master)](https://travis-ci.org/kris-lab/pulsar-rest-api)

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

[app] - application name (e.g. foobar)
[env] - environment name (e.g. production)
[taskId] - task ID

#### Create Task

`POST /[app]/[env]'
 Parameters:
   `action` Action name passed to pulsar

 Returns:
   Success:
     HTTP response code 200
     `{ taskId: [newly created taskId] }`

#### Get task data

Immediately returns all task data including output to date.

  `GET /task/[taskId]`

 Returns:
   Success:
     HTTP response code 200
     ```
    {
       "id":47,
       "status":"failed",
       "app":"fuboo",
       "env":"production",
       "action":"shell",
       "exitCode":null,
       "output":"[output goes here]",
       "pid":48691
    }
    ```

#### Observe task data (for long pooling)

This listens for any task state changes (e.g. new output) and when it happens returns full task data is returned. If state is 'running' the client
should re-connect to this method in order to wait for new data. This methods timeouts each 30s after which it should be called again. (this may change in the near future).

  `GET /task/[taskId]`

 Returns:
   Task changed before the timeout
      HTTP response code 200
      ```
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

    Task not changed before the timeout
       HTTP response code 200
       ```
      {
         "changed": false
      }
      ```


