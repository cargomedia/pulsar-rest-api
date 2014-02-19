var app = app || {};

(function($) {
	'use strict';

	app.TaskView = Backbone.View.extend({

		tagName: 'li',

		className: 'list-group-item',

		template: _.template($('#task-template').html()),

		events: {
			'click .task-kill': 'killTask'
		},

		initialize: function() {
			this.listenTo(this.model, 'change', this.render);
		},

		render: function() {
			this.$el.html(this.template(this.model.toJSON()));
		},

		killTask: function() {
			$.post('/task/' + this.model.id + '/kill');
		}
	});

})(jQuery);
