var app = app || {};

(function($) {
  'use strict';

  app.JobSingleView = app.JobAbstractView.extend({

    template: _.template($('#job-template').html()),

    events: {
      'click .kill': 'killJob'
    },

    initialize: function() {
      this.listenTo(this.model, 'change', this._modelChanged);
    },

    _modelChanged: function() {
      this.render();
      window.scrollTo(0, document.body.scrollHeight);
    },

    render: function() {
      var job = this.model;
      job.set('statusColor', this.getStatusColor(job.get('status')));
      this.$el.html(this.template(job.toJSON())).find('.timeago').timeago();
    },

    killJob: function() {
      $.post('/job/' + this.model.id + '/kill');
    },

    close: function() {
      this.unbind();
      this.model.unbind("change", this._modelChanged);
      this.remove();
    }
  });

})(jQuery);
