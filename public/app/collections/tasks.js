var app = app || {};

(function() {
	'use strict';

    app.TaskList = Backbone.Collection.extend({

		model: app.Task,

        url: '/tasks'

//		completed: function() {
//			return this.filter(function(task) {
//				return task.get('completed');
//			});
//		},
//
//		running: function() {
//			return this.without.apply(this, this.status('RUNNING'));
//		},
//
//        status: function(model, status) {
//            if (model.status == status) {
//                return true;
//            }
//        },

//		getFromServer: function() {
//			var self = this;
//			$.get('/tasks', function(response) {
//                self.set(response.tasks);
//			}, 'json');
//		}
	});

})();
