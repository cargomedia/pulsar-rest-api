var app = app || {};

(function() {
	'use strict';

	var PulsarRouter = Backbone.Router.extend({
		routes: {
			'*filter': 'setFilter'
		},

		setFilter: function(param) {
			app.PulsarFilter = param || '';
			app.tasks.trigger('filter');
		}
	});

	app.PulsarRouter = new PulsarRouter();
	Backbone.history.start();
})();
