var app = app || {};

(function($) {
	'use strict';

	app.TaskListView = Backbone.View.extend({
		initialize: function() {
            this.$count = $('#task-count');

            this.listenTo(this.collection, 'add', this.render);
		},

		render: function() {
            if (this.collection.length) {
                this.$count.html(this.collection.length);
                this.$el.show();
            } else {
                this.$el.hide();
            }

			this.$el.html('');
			this.collection.each(function(task) {
				var view = new app.TaskView({ model: task });
				view.render();
				this.$el.prepend(view.el);
			}, this);
		}

	});

})(jQuery);
