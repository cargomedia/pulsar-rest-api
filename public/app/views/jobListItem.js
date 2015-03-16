var app = app || {};

(function($) {
  'use strict';

  app.JobListItemView = Backbone.View.extend({

    tagName: 'tr',

    template: _.template($('#job-list-item-template').html()),

    initialize: function() {
      this.listenTo(this.model, 'change', this.render);
    },

    render: function() {
      this.$el.html(this.template(this.model.toJSON())).find('.timeago').timeago();
    }

  });

})(jQuery);
