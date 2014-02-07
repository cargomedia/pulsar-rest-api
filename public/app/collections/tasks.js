var app = app || {};

(function() {
	'use strict';

    app.TaskList = Backbone.Collection.extend({

		model: app.Task,

		localStorage: new Backbone.LocalStorage('tasks-pulsar'),

		completed: function() {
			return this.filter(function(task) {
				return task.get('completed');
			});
		},

		remaining: function() {
			return this.without.apply(this, this.completed());
		},

		nextOrder: function() {
			if (!this.length) {
				return 1;
			}
			return this.last().get('order') + 1;
		},

		comparator: function(task) {
			return task.get('order');
		},

		getFromServer: function() {
			var self = this;
			$.get('/tasks', function(response) {
				_.each(response.tasks, function(task) {
					self.add(task)
				});
			}, 'json');
		}
	});

})();
