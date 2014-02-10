var app = app || {};

(function() {
	'use strict';

	app.Task = Backbone.Model.extend({

		defaults: {
			status: null,
			output: null,
			completed: false
		},

        urlRoot : '/task'

	});
})();
