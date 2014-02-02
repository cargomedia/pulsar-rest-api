var https = require('https');

module.exports = (function() {

	var url = 'https://api.github.com/user';

	/**
	 * @constructor
	 */
	function OAuth2Basic(urlApi) {
		create(urlApi);
	}

	var create = function(urlApi) {
		if(urlApi) {
			url = urlApi;
		}
	}

	OAuth2Basic.prototype.checkToken = function(token, callback) {

		var host = 'api.github.com';
		var username = token;
		var password = 'x-oauth-basic';

		var protocol = "https";
		var port = (protocol == "https" ? 443 : 80);

		var auth = 'Basic ' + new Buffer(username + ':' + password).toString('base64');

		var options = {
			hostname: 'api.github.com',
			port: 443,
			path: '/user',
			method: 'GET',
			headers:{
				Authorization: auth,
				Host: 'api.github.com'
			}
		};

		var headers = {
			"host": host,
			"content-length": "0"
		};

		if (!headers["User-Agent"])
			headers["User-Agent"] = "NodeJS HTTP Client";

		if (!headers["Authorization"])
			headers["Authorization"] = username + ':' + password;

		var options = {
			host: host,
			port: port,
			path: '/user',
			method: 'GET',
			headers: headers
		};

		var callbackCalled = false

		var req = require(protocol).request(options, function(res) {

			console.log("STATUS: " + res.statusCode);
			console.log("HEADERS: " + JSON.stringify(res.headers));

			res.setEncoding("utf8");
			var data = "";
			res.on("data", function(chunk) {
				data += chunk;
			});
			res.on("error", function(err) {
				if (!callbackCalled) {
					callbackCalled = true;
					callback(err);
				}
			});
			res.on("end", function() {
				if (!callbackCalled && res.statusCode >= 400 && res.statusCode < 600 || res.statusCode < 10) {
					callbackCalled = true;
					callback(new error.HttpError(data, res.statusCode))
				}
				else if (!callbackCalled) {
					res.data = data;
					callbackCalled = true;
					callback(null, res);
				}
			});
		});

	}

	return OAuth2Basic;
})()
