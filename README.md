[![Build Status](https://travis-ci.org/cargomedia/pulsar-rest-api.png?branch=master)](https://travis-ci.org/cargomedia/pulsar-rest-api)

pulsar-rest-api
===============

## About
HTTP REST API for executing [pulsar](https://github.com/nebulab/pulsar) jobs.

### Install
Package is in nodejs and is available through npm registry:
```
npm install pulsar-rest-api [-g]
```

### Run
#### Prepare valid config.
The instance of pulsar-rest-api can be run with different options. All of the options can be specified in the config. To run the instance with your own config you need to specify the filepath to it with the flag `-c`. For example `pulsar-rest-api -c '~/my_pulsar_config.yaml'`.

The default config is [`config.yaml`](bin/config.yaml) and it can be found in `bin` directory of the pulsar-rest-api installation.

Please read carefully through the format of the config below. The options that are marked as required must be present in your config otherwise the instance won't start. There are no options that have default value. All values should be clearly defined.

- `port`: required. Port where server listens for requests.
- `logPath`: required. A file path where to write logs. Includes filename of the log. Can be absolute or relative.
- `mongodb`: mongoDB connection parameters
  - `host`: required. hostname
  - `port`: required. port
  - `db`: required. database name. Now there is only one collection 'jobs' will be used.
- `pulsar`:
  - `repo`: optional. Pulsar configuration repository. If omitted then the [pulsar rules](https://github.com/nebulab/pulsar#loading-the-repository) are applied.
  - `branch`: optional. Branch of pulsar configuration repository. If omitted then the [pulsar rules](https://github.com/nebulab/pulsar#loading-the-repository) are applied.
- `authentication`: optional. Authentication. Only if presented it should have its required options to be filled, otherwise no need to fill `authentication.githubOauthId` and etc.
  - `githubOauthId`: required. Github OAuth Application ID.
  - `githubOauthSecret`: required. Github OAuth Application Secret.
  - `githubOrg`: required. Github organization. User needs to be member of that organization to get access to the interface of pulsar-rest-api.
  - `baseUrl`: required. URL where the pulsar-rest-api instance would have its web interface.
  - `authorization`: optional. Authorization. If you use an organization in this section, you should consider the restriction that only the users with public access in the organization would have the corresponding role of the organization. To remove this restriction the Pulsar-Rest-Api would require a `user` scope for the user's Github account which is too much. For more information read https://developer.github.com/v3/orgs/. Also the current role model does not have any inheritance or any other relation in it. That means if user has the `write` role, he is still forbidden to the actions that require the `read` role. So, for solving this you need to mention user in the both roles descriptions.
    - `read`: required. Github users or organizations that have the read role.
    - `write`: required. Github users or organizations that have the write role.
- `ssl`: optional. Only if presented it should have its required options to be filled, otherwise no need to fill `ssl.key` and etc.
  - `key`: required if `pfx` isn't presented. Ssl private key file. Combine with `cert` option.
  - `cert`: required if `pfx` isn't presented. Ssl public certificate file. Combine with `key` option. Append CA-chain within this file.
  - `pfx`: required if `key` or `cert` options aren't presented. Ssl pfx file (key + cert). Overrides `key` and `cert` options.
  - `passphrase`: optional. File containing the ssl passphrase.

##### Github OAuth App setup.
  - Go to https://github.com/settings/applications/new.
  - There is going to be a form. Fill it up. For example here is the values that I've used on my local setup:
    - `Application name` = pulsar-rest-api
    - `Homepage URL` = https://localhost:8001. That value should be the same as `authentication.baseUrl` from the config.
    - `Application description`. It's optional. You can leave it empty.
    - `Authorization callback URL`. It's optional. You can leave it empty and it will be the same as `Homepage URL`.
  - Submit them and you will receive `Client ID` and `Client Secret` which are `githubOauthId` and `githubOauthSecret` correspondingly. 

##### Authorization setup.
The authorization model is separate from the logic. Because of that if you want to have authorization for some url endpoint, you need to set an authorization rule separately from the url. Those rules can be set only as the parameter-function `restrictions` of `authentication.installHandlers`.
For example, Pulsar-Rest-Api has a 'Create Job' url endpoint `/:app/:env`. If you want to restrict this action to the `write` role then you need to have the next call to `authentication.installHandlers`:
```js
  authentication.installHandlers(app, function restrictions(authorization) {
    router.post('/:app/:env', authorization.restrictTo('write'));
  });
```
The parameter-function `restrictions` has the instance of Authorization module as its only argument.

#### Running as standalone service
`pulsar-rest-api -c 'your_config.yaml'`. After that web interface should be browsable through 'localhost:`{config.port}`' or url defined in `authentication.baseUrl` if `authentication` is enabled.

#### with docker-compose
```
docker-compose up pulsar-rest-api
```
It spins up the mongodb and pulsar-rest-api containers.

In development, you can mount the repository as a volume (remember to install npm dependencies locally before)
```
npm install
docker-compose run --volume $(pwd):/opt/pulsar-rest-api pulsar-rest-api
```

### Tests

#### Auto tests
```
docker-compose run --volume $(pwd):/opt/pulsar-rest-api pulsar-rest-api ./bin/test.sh [mocha-options...]
```

#### Manual tests
To see how API is working you need to run its instance and open `http[s]://localhost:{port}` to see its web interface where `port` must be defined in your config and you may have an `https` prefix if you have `ssl` in the config. Further in examples below we will use a simple endpoint `http://localhost:8001`.

To create a job, type in console:
`curl -H "Content-Type: application/json" -X POST -d '{"task":"dummy:my_sleep"}' http://localhost:8001/example/production`
You can see the result in the web interface. Do not forget that you will need these `application`, `environment` and `task` to be present in your pulsar configuration.

## API documentation
Shortnames that are used below:
`:app` - application name (e.g. example)
`:env` - environment name (e.g. production)
`:task` - capistrano task
`:id` - pulsar job ID

### Get job list

#### Request:
`GET /jobs?currentPage=:currentPage&pageSize=:pageSize`

`:currentPage` - number of page of job list to fetch. Possible values: `Number`. Default: `0`.
`:pageSize` - number of jobs per page. Possible values: `Number`. Default: `10`.
#### Response on success:
HTTP response code `200`
```
{[{Job}, {Job}, ...]}
```
See the description of `{Job}` at [getJobData](#get-job-data) operation below.

### Create Job

#### Request:
```
POST /:app/:env
data:
{
   ":task": "<string>",
   "wait": "<boolean>",
   "taskVariables": {Object.<string, string>}
}

```

`wait` - does request wait for the job's end. Possible values: `true/false`. Default: `false`.

`taskVariables` - capistrano task options. Optional. These options will be used as `-s` options of capistrano. Possible values: `json object` where keys and values are strings or objects that are convertible to string.


#### Response on success:
HTTP response code `200`
```json
{
  "id": "123",
  "url": "http://localhost:8001/web#job/532c3240f8214f0000177376"
}
```

In case of `wait=true` the job's data will be returned:
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
Besides a rest and a web interface the instance of pulsar-rest-api also offers a web socket interface. The interface is available under the web interface with suffix `/websocket`. For our example above it would be `http://locahost:8001/websocket`. Currently the websocket interface doesn't expect any incoming messages and only transmits events about jobs' lifecycle.

#### Job was created
`{message: {event: 'job.create', job: {Object}}}`

#### Job was changed
`{message: {event: 'job.change', job: {Object}}}`

## Authentication
To enable authentication of API you need to provide config option `authentication`. All users of API should remember that besides of your authentication with Github, you also need to be a member of Github organization that was defined in `authentication.githubOrg` of config.

  - #### Web client
  If you interact with API through the web interface then you will need to follow standard [Github Web Application Flow](https://developer.github.com/v3/oauth/#web-application-flow) procedure.
  If everything is ok then you will be able to interact with web interface of API.

  - #### Rest API
  If you want to access API directly, for example through the `curl` tool, then you need to provide your Github basic token with every request.
  If you don't have one then you can get it here https://github.com/settings/tokens/new. After that you can use API like this:
  `curl -u {github-token}:x-oauth-basic -H "Content-Type: application/json" -X POST -d '{"task":"dummy:my_sleep"}' https://localhost:8001/example/production`

  - #### Websocket
  When socket client gets connected it needs to send authentication information as its first message. There are two options available:
   * Github OAuth token. It is the same token as you would use in Rest API `curl` command.
    ```js
      sock.onopen = function() {
        sock.send(JSON.stringify({
          token: 'put your Github token here'
        }));
      };
    ```
   * Cookie
    This option is available only if you are using websocket in pair with web interface. When web interface gets successful authentication it receives
    a `userid` cookie which you can send instead of Github token.
    ```js
      sock.onopen = function() {
        sock.send(JSON.stringify({
          cookie: $.cookie('userid')
        }));
      };
    ```
   If token was wrong, connection will be closed, otherwise it will start to receive messages.
