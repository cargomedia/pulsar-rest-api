var app = app || {};

(function() {
	'use strict';

	app.Task = Backbone.Model.extend({

		defaults: {
			id: null,
			status: null,
			output: null,
			completed: false
		},

		toggle: function() {
			this.save({
				completed: !this.get('completed')
			});
		}
	});
})();
