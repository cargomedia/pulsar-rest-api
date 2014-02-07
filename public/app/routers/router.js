var app = app || {};

(function() {
	'use strict';

	var PulsarRouter = Backbone.Router.extend({
		routes: {
			'*filter': 'loadTaskList',
            'task/:id': 'loadTask'
		},

        loadTaskList: function() {
            // show all running tasks
        },

        loadTask: function(id) {
            // show only task-id
        }

	});

	app.PulsarRouter = new PulsarRouter();
	Backbone.history.start();

})();
