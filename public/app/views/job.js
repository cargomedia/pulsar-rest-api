var app = app || {};

(function($) {
  'use strict';

  app.JobView = Backbone.View.extend({

    tagName: 'li',

    className: 'list-group-item',

    template: _.template($('#job-template').html()),

    events: {
      'click .job-kill': 'killJob'
    },

    initialize: function() {
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
