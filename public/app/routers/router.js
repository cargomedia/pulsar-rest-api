var app = app || {};

(function() {
	'use strict';

	var PulsarRouter = Backbone.Router.extend({
		routes: {
            'task/:id': 'loadTask',
            '*index': 'loadTaskList'
		},

		loadTaskList: function(param) {
			app.PulsarFilter = param || '';
			app.tasks.trigger('filter');
		},

        loadTask: function(param) {
            app.PulsarFilter = param || '';
            app.tasks.trigger('filter');
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
