var app = app || {};

(function($) {
  'use strict';

  app.JobSingleView = app.JobAbstractView.extend({

    template: _.template($('#job-template').html()),

    events: {
      'click .job-kill': 'killJob'
    },

    initialize: function() {
      this.setElement(this.el);
      this.listenTo(this.model, 'change', function() {
        this.render();
        window.scrollTo(0, document.body.scrollHeight);
      });
    },

    render: function() {
      var job = this.model;
      job.set('statusColor', this.getStatusColor(job.get('status')));
      this.$el.html(this.template(job.toJSON())).find('.timeago').timeago();
    },

    killJob: function() {
      $.post('/job/' + this.model.id + '/kill');
    }
  });

})(jQuery);
