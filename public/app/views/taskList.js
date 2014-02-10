var app = app || {};

(function($) {
	'use strict';

	app.TaskListView = Backbone.View.extend({
		initialize: function() {
            this.$count = $('#task-count');

            this.listenTo(this.collection, 'add', this.addOne);
            this.listenTo(this.collection, 'all', this.render);

            this.observeTasks();
		},

		render: function() {
            if (this.collection.length) {
                this.$count.html(this.collection.length);
                this.$el.show();
            } else {
                this.$el.hide();
            }

			this.addAll();
		},

        addOne: function(task) {
            var view = new app.TaskView({ model: task });
            this.$el.prepend(view.render().el);
        },

        addAll: function() {
            this.$el.html('');
            this.collection.each(this.addOne, this);
        },

        observeTasks: function() {
            var self = this;
            $.get('/tasks/created', function(result) {
                if (result.changed) {
                    this.collection.add(result.task);
                }
                self.observeTasks();
            }, 'json');
        }

	});

})(jQuery);
