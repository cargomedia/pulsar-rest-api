[![Build Status](https://travis-ci.org/cargomedia/pulsar-rest-api.png?branch=master)](https://travis-ci.org/cargomedia/pulsar-rest-api)

(unstable, currently in development)

pulsar-rest-api
===============

## About
HTTP REST API for executing [pulsar](https://github.com/nebulab/pulsar) jobs.

## Server

### Installation
Package is in nodejs and is available through npm registry:
```
npm install pulsar-rest-api [-g]
```

### Running
####In short
 * Prepare valid config.
 * Verify that mongodb is up and running.
 * Run the instance with command `pulsar-rest-api -c 'your_config.yaml'`

####In detail
#####Prepare valid config
The instance of pulsar-rest-api can be run with different options. All of the options can be specified in the config. To run the instance with
your own config you need to specify the filepath to it with the flag `-c`. For example `pulsar-rest-api -c '~/my_pulsar_config.yaml'`.

The default config is [`config.yaml`](bin/config.yaml) and it can be found in `bin` directory of the pulsar-rest-api installation.

Please read carefully through the format of the config below. The options that are marked as required must be present in your config otherwise the
instance won't start. There are no options that have default value. All values should be clearly defined.

- `port`. required. Port where server listens for requests.
- `logPath`. required. A file path where to write logs. Includes filename of the log. Can be absolute or relative.
- `mongodb`. mongoDB connection parameters
  - `host`. required. hostname
  - `port`. required. port
  - `db`. required. database name. Now there is only one collection 'jobs' will be used.
- `pulsar`:
  - `repo`. optional. Pulsar configuration repository. If omitted then [pulsar rules](https://github.com/nebulab/pulsar#loading-the-repository) applied.
  - `branch`. optional. Branch for pulsar configuration repository. If omitted then [pulsar rules](https://github.com/nebulab/pulsar#loading-the-repository) applied.
- `auth`. optional. Authentication. Only if presented it should have its required options to be filled, otherwise no need to fill `auth.githubOauthId` and etc.
  - `githubOauthId`. required. Github OAuth Application ID.
  - `githubOauthSecret`. required. Github OAuth Application Secret.
  - `githubOrg`. required. Github organization. User needs to be member of that organization to get access to the interface of pulsar-rest-api.
  - `baseUrl`. required. URL where the pulsar-rest-api instance would have its web interface.
  - `callbackUrl`. required. OAuth callback Url. Must be relative to the `baseUrl`.
- `ssl`. required if `auth` block is presented else it's optional. Only if presented it should have its required options to be filled, otherwise no need to fill `ssl.key` and etc.
  - `key`. required if `pfx` isn't presented. Ssl private key file. Combine with `cert` option.
  - `cert`. required if `pfx` isn't presented. Ssl public certificate file. Combine with `key` option. Append CA-chain within this file.
  - `pfx`. required if `key` or `cert` options aren't presented. Ssl pfx file (key + cert). Overrides `key` and `cert` options.
  - `passphrase`. optional. File containing the ssl passphrase.

##### Github OAuth App setup.
  - Go to https://github.com/settings/applications/new.
  - There are going to be the fields: `Application name`, `Homepage URL`, `Application description`, `Authorization callback URL`. Fill them up.
    For example here is the values that I've used on my local setup:
    - `Application name` = pulsar-rest-api
    - `Homepage URL` = https://api.pulsar.local:8001. That value should be the same as `baseUrl` from the config.
    - `Application description` = bla bla super cool
    - `Authorization callback URL` = https://api.pulsar.local:8001
  
  The only important info here is that `Homepage URL` and `Authorization callback URL` should be the same. Don't forget it when you fill your app.
  - Submit them and you will receive `Client ID` and `Client Secret`. They are `githubOauthId` and `githubOauthSecret` correspondingly. 

#####Verify that mongodb is up and running
The mongodb instance that you defined in your config should be up and running before you start the pulsar.

#####Run
`pulsar-rest-api -c 'your_config.yaml'`. After that web interface should be browsable through url defined in `auth.baseUrl`.

### Test

#### Auto tests
To run these tests you need the running instance of mongodb. The required configuration of mongodb can be found in `test/config.yaml`, section `mongodb`.
When mongodb is running type in console `npm test`.

#### Manual tests
To see how the server is working you need to run its instance and open `http://localhost:8001` to see its web interface.
Do not forget that you may have another port in your config and hence you will need to adjust the port of page url.

To create a job type in console:
`curl -H "Content-Type: application/json" -X POST -d '{"task":"dummy:my_sleep"}' http://localhost:8001/example/production`
You can see the result in the web interface. Do not forget that you will need these `application`, `environment` and `task` to be present in your
pulsar configuration.

## API documentation

`:app` - application name (e.g. foobar)

`:env` - environment name (e.g. production)

`:task` - capistrano task

`:id` - pulsar job ID

### Get job list

#### Request:
`GET /jobs`

#### Response on success:
HTTP response code `200`
```
{
  "url": "http://api.pulsar.local:8001/pulsar/index.html",
  "jobs": [{Object}, {Object}, ...]
}
```
See the description of `jobs` in [getJobData](#get-job-data) operation below.

### Create Job

#### Request:
```
POST /:app/:env
data:
{
   "task": "<string>",
   "wait": "<boolean>",
   "taskVariables": {Object.<string, string>}
}

```
`:wait` - does request wait for the job's end. Possible values: `true/false`. Default: `false`.

`:taskVariables` - capistrano task options. Optional. These options will be used as `-s` options of capistrano. Possible values: `json object` where
keys and values are strings or objects that are convertible to string.


#### Response on success:
HTTP response code `200`
```json
{
  "id": "123",
  "url": "http://localhost:8001/web#job/532c3240f8214f0000177376"
}
```

In case of a blocking execution the job's data will be returned:
```json
{
  "id": 123,
  "url": "http://localhost:8001/web#job/532c3240f8214f0000177376",
  "data": {
    "id": 123,
    "status": "failed",
    "app": "fuboo",
    "env": "production",
    "task": "shell",
    "exitCode": null,
    "stdout": "stdout of pulsar job's process",
    "output": "stdout + stderr of pulsar job's process",
    "pid": 48691
  }
}
```

### Get job data

Immediately returns all job data including output to date.

#### Request:
`GET /job/:id`

#### Response on success:
HTTP response code `200`
```json
{
  "id": 123,
  "status": "failed",
  "app": "fuboo",
  "env": "production",
  "task": "shell",
  "exitCode": null,
  "stdout": "stdout of pulsar job's process",
  "output": "stdout + stderr of pulsar job's process",
  "pid": 48691
}
```

### Kill job

#### Request
`GET /job/:id/kill`

#### Response
HTTP response code `200`

### WebSocket API
Besides rest and web interface the instance of pulsar-rest-api also offers web socket interface. Interface is available on `{config.baseUrl}/websocket`.
Currently the interface doesn't expect any incoming messages and only transmits events about jobs' lifecycle.

####
Job was created
`{message: {event: 'job.create', job: {Object}}}`

####
Job was changed
`{message: {event: 'job.change', job: {Object}}}`

## Authentication
To enable authentication of API you need to provide config options `auth` and `ssl`. All users of API should remember that besides that you need
to authenticate yourself with Github, you also need to be a member of Github organization that was defined in `auth.githubOrg` of config.

### Web client
If you interact with API through the web interface then you will need to follow standard [Github Web Application Flow](https://developer.github.com/v3/oauth/#web-application-flow) procedure.
If everything is ok then you will be able to interact with web interface of API.

### Rest API
If you want access API directly, for example through the `curl` tool, then you need to provide your Github basic token with every request.
If you don't have one then you can get it here https://github.com/settings/tokens/new. After that you can use API like this:
`curl -u {put your Github token here, remove curly braces}:x-oauth-basic -H "Content-Type: application/json" -k -X POST -d '{"task":"dummy:my_sleep"}' https://api.pulsar.local:8001/example/production`

### Websocket
When socket client gets connected it needs to send authentication information as its first message. There are two options available:

#### Github token
```js
  sock.onopen = function() {
    sock.send(JSON.stringify({
      token: 'put your Github token here'
    }));
  };
```
#### Cookie
This option is available only if you are using websocket in pair with web interface. When web interface gets successful authentication it receives
cookie `userid` which you can send instead of Github token.
```js
  sock.onopen = function() {
    sock.send(JSON.stringify({
      cookie: $.cookie('userid')
    }));
  };
```
If token was wrong, connection would be closed, otherwise it would start to receive messages.
