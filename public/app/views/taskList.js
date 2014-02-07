var app = app || {};

(function($) {
	'use strict';

	app.TaskListView = Backbone.View.extend({

		events: {
			'click #kill-task': 'killTask',
			'click #toggle-all': 'toggleAllComplete'
		},

		initialize: function() {
		},

		render: function() {
			this.$el.html('hello');
		}
	});

})(jQuery);
