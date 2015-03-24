var app = app || {};

(function() {
  'use strict';

  var jobList = new app.JobList();
  var jobListView = new app.JobListView({el: $('#job-list'), collection: jobList});

  var PulsarRouter = Backbone.Router.extend({
    routes: {
      'job/:id(/)': 'showJob',
      '*index': 'showJobList'
    },

    showJobList: function() {
      var self = this;
      jobList.fetch({
        success: function() {
          jobListView.render();
          var job = jobList.last();
          if (job) {
            self._renderJob(job);
          }
        }
      });
    },

    showJob: function(id) {
      var self = this;
      var job = jobList.get(id);
      if (job) {
        this._renderJob(job);
      } else {
        job = new app.Job({id: id});
        job.fetch({
          success: function() {
            jobList.add(job);
            jobListView.render();
            self._renderJob(job);
          }
        });
      }
    },

    _renderJob: function(job) {
      var jobView = new app.JobView({el: $('#job'), model: job});
      jobView.render();
    }
  });

  $(document).on('click', 'a[href]', function(event) {
    var historyRoot = Backbone.history.options.root;
    var root = location.protocol + "//" + location.host + historyRoot;

    if (this.href && this.href.slice(0, root.length) === root) {
      event.preventDefault();
      Backbone.history.navigate(this.href.substr(root.length), true);
    }
  });

  app.PulsarRouter = new PulsarRouter();
  Backbone.history.start({pushState: true, root: '/web'});

  function installSocket(url) {
    var sock;
    var reconnectInterval;
    var feedback = $('#websocket-feedback');

    function startReconnect() {
      if (reconnectInterval) {
        return;
      }
      reconnectInterval = setInterval(function() {
        createSocket();
        feedback.show();
      }, 5000);
    }

    function stopReconnect() {
      clearInterval(reconnectInterval);
      feedback.hide();
    }

    function createSocket() {
      sock = new SockJS(url);
      sock.onopen = function() {
        stopReconnect();

        sock.send(JSON.stringify({
          cookie: $.cookie('userid')
        }));
      };

      sock.onerror = sock.onclose = startReconnect;

      sock.onmessage = function(e) {
        var message = JSON.parse(e.data);
        var job;
        switch (message.event) {
          case 'job.create':
            job = new app.Job(message.job);
            jobList.add(job);
            break;
          case 'job.change':
            job = jobList.get(message.job.id);
            job.set(message.job);
            break;
          case 'job.close':
            job = jobList.get(message.job.id);
            job.set(message.job);
            break;
          default:
            break;
        }
      };

    }

    createSocket();
  }

  installSocket('/websocket');
})();
