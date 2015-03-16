var app = app || {};

(function($) {
  'use strict';

  app.JobView = Backbone.View.extend({

    template: _.template($('#job-template').html()),

    events: {
      'click .job-kill': 'killJob'
    },

    initialize: function() {
      this.setElement(this.el);
      this.listenTo(this.model, 'change', this.render);
    },

    render: function() {
      this.$el.html(this.template(this.model.toJSON()));
    },

    killJob: function() {
      $.post('/job/' + this.model.id + '/kill');
    }
  });

})(jQuery);
