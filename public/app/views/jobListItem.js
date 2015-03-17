var app = app || {};

(function($) {
  'use strict';

  app.JobListItemView = Backbone.View.extend({

    template: _.template($('#job-list-item-template').html()),

    initialize: function() {
      this.listenTo(this.model, 'change', this.render);
    },

    render: function() {
      this.$el = $(this.template(this.model.toJSON()));
      this.$el.find('.timeago').timeago();
      this.el = this.$el.get(0);
    }

  });

})(jQuery);
