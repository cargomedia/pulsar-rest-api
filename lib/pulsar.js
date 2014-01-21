var _ = require('underscore');

module.exports = (function() {

	/**
	 * @param {Object} api
	 * @constructor
	 */
	function Pulsar(api) {
		applyRules(api);
	}

	var applyRules = function(api) {
		api.get('/:application/:environment/:action', function (req, res) {
			res.send(req.params);
			return next();
		});
		api.get('/status/:params', function (req, res) {
			res.send(req.params);
			return next();
		});
	}

	return Pulsar;
})()
