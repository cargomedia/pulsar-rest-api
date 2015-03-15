var app = app || {};

(function($) {
  'use strict';

  app.JobListItemView = Backbone.View.extend({

    template: _.template($('#job-list-item-template').html()),

    initialize: function() {
      this.listenTo(this.model, 'change', this.render);
    },

    render: function() {
      this.setElement(this.template(this.model.toJSON()));
    }

  });

})(jQuery);
