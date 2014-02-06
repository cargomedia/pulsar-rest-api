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
			this.listenTo(this.model, 'destroy', this.remove);

			this.observeTask();
		},

		render: function() {
			if (this.model.changed.id !== undefined) {
				return;
			}

			this.$el.html(this.template(this.model.toJSON()));
			this.$el.toggleClass('completed', this.model.get('completed'));
			this.$input = this.$('.edit');
			return this;
		},

		killTask: function() {
			$.post('/task/' + this.model.id + '/kill');
		},

		observeTask: function() {
			var self = this;
			$.get('/task/' + this.model.id + '/output', function(result) {
				if (result.changed) {
					self.model.set(result.task);
				}
				if (self.model.get('status') == 'RUNNING' || self.model.get('status') == 'CREATED') {
					self.observeTask();
				}
			}, 'json');
		}
	});

})(jQuery);
