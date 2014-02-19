var app = app || {};

(function () {
    'use strict';

    var PulsarRouter = Backbone.Router.extend({
        routes: {
            'task/:id': 'loadTask',
            '*index': 'loadTaskList'
        },

        loadTaskList: function () {
			var taskList = new app.TaskList();
            var view = new app.TaskListView({el: $('#task-list'), collection: taskList});
            view.render();
            taskList.fetch();
        },

        loadTask: function (id) {
//            if (taskList.contains(id)) {
//                task = taskList.find(id);
//                var view = new app.TaskView({el: $('#task-list'), model: task});
//                view.render();
//            }
//            var task = new app.Task({id: id});
//            task.fetch({
//                success: function () {
//                    var view = new app.TaskView({el: $('#task-list'), model: task});
//                    view.render();
//                }
//            });
        }
    });

    $(document).on('click', 'a[href^="/"]', function (event) {
        var historyRoot = Backbone.history.options.root;
        var root = location.protocol + "//" + location.host + historyRoot;

        if (this.href && this.href.slice(0, root.length) === root) {
            event.preventDefault();
            Backbone.history.navigate(this.href.substr(root.length), true);
        }
    });

    app.PulsarRouter = new PulsarRouter();
    Backbone.history.start({pushState: true, root: '/web'});
})();
