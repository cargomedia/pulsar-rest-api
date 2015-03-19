var app = app || {};

(function() {
  'use strict';

  var jobList = new app.JobList();

  var PulsarRouter = Backbone.Router.extend({
    routes: {
      'job/:id(/)': 'showJob',
      '*index': 'showJobList'
    },

    showJobList: function() {
      this._show();
    },

    showJob: function(id) {
      this._show(id);
    },

    _show: function(id) {
      jobList.fetch({
        success: function() {
          var jobListView = new app.JobListView({el: $('#job-list'), collection: jobList});
          jobListView.render();

          var job = jobList.get(id) || jobList.at(0);
          var jobView = new app.JobView({el: $('#job'), model: job});
          jobView.render();
        }
      });
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

    function startReconnect(){
      if (reconnectInterval) {
        return;
      }
      reconnectInterval = setInterval(function() {
        createSocket();
        feedback.show();
      }, 5000);
    }

    function stopReconnect(){
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
