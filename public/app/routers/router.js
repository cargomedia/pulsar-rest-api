var app = app || {};

(function() {
	'use strict';

	var taskList = new app.TaskList();

	var PulsarRouter = Backbone.Router.extend({
		routes: {
			'task/:id': 'loadTask',
			'*index': 'loadTaskList'
		},

		loadTaskList: function() {
			taskList.fetch({
				success: function() {
					var view = new app.TaskListView({el: $('#content'), collection: taskList});
					view.render();
				}
			});
			this.updateNav('taskList');
		},

		loadTask: function(id) {
			var task = taskList.get(id) || taskList.add({id: id});
			task.fetch({
				success: function() {
					var view = new app.TaskView({el: $('#content'), model: task});
					view.render();
				}
			});
			this.updateNav('task');
		},

		updateNav: function(page) {
			$('.nav-page').removeClass('active');
			$('.nav-page-' + page).addClass('active');
		}
	});

	$(document).on('click', 'a[href]', function(event) {
		var historyRoot = Backbone.history.options.root;
		var root = location.protocol + "//" + location.host + historyRoot;

		if (this.href && this.href.slice(0, root.length) === root) {
			event.preventDefault();
			Backbone.history.navigate(this.href.substr(root.length), true);
		}
	});

	app.PulsarRouter = new PulsarRouter();
	Backbone.history.start({pushState: true, root: '/web'});

	var sock = new SockJS('/websocket');
	sock.onmessage = function(e) {
		var message = JSON.parse(e.data)
		switch(message.event){
			case 'task.create':
				var task = new app.Task(message.task);
				taskList.add(task);
				break;
			case 'task.change':
				var task = taskList.get(message.task.id);
				task.set(message.task);
				break;
		}
	};
})();
