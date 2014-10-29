var app = app || {};

(function() {
  'use strict';

  var jobList = new app.JobList();

  var PulsarRouter = Backbone.Router.extend({
    routes: {
      'job/:id': 'loadJob',
      '*index': 'loadJobList'
    },

    loadJobList: function() {
      jobList.fetch({
        success: function() {
          var view = new app.JobListView({el: $('#content'), collection: jobList});
          view.render();
        }
      });
      this.updateNav('jobList');
    },

    loadJob: function(id) {
      var job = jobList.get(id) || jobList.add({id: id});
      job.fetch({
        success: function() {
          var view = new app.JobView({el: $('#content'), model: job});
          view.render();
        }
      });
      this.updateNav('job');
    },

    updateNav: function(page) {
      $('.nav-page').removeClass('active');
      $('.nav-page-' + page).addClass('active');
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
    var feedback = $('#feedback');

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
        }
      };

    }

    createSocket();
  }

  installSocket('/websocket');
})();
