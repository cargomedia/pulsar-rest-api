

$(function() {
	$.get('/tasks', function(taskList) {
		var taskListContainer = $('.taskList').html('');
		for (var id in taskList) {
			var $taskItem = $('<pre class="task"></pre>');
			$taskItem.html(taskList[id].output);
			taskListContainer.append($taskItem);
		}
		console.log(data);
	}, 'json');

});
