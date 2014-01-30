function updateTask(task) {
	var $taskElement = $('#task-' + task.id);
	if (!$taskElement.length) {
		// todo: create the element
	}

	$taskElement.find('.taskId').text(task.id);
	$taskElement.find('.status').text(task.status);
	$taskElement.find('.output').html(task.output);
	return $taskElement;
}

function renderTasks(taskList) {
	var taskListContainer = $('.taskList').html('');
	for (var id in taskList) {
		var task = taskList[id];
		// todo: use templates here
		var $taskElement = $('<div class="task" id="task-' + task.id + '"><div>Task ID: <span class="taskId"></span></div> <div>Status: <span class="status"></span></div> <pre class="output"></pre></div> <button class="kill" onclick="killTask(' + task.id + ')">kill task</button>');
		taskListContainer.append($taskElement);
		updateTask(task);
		observeTask(task);
	}
}

function killTask(taskId) {
	$.post('/task/' + taskId + '/kill');
}

function observeTask(task) {
	$.get('/task/' + task.id + '/state', function(result) {
		if (result.changed) {
			task = result.task;
			var taskListContainer = $('.taskList');
			updateTask(task);
		}

		if (task.status == 'RUNNING') {
			observeTask(task);
		}
	}, 'json');
}

function refreshTaskList() {
	$.get('/tasks', function(taskList) {
		renderTasks(taskList);
	}, 'json');
}

$(function() {
	refreshTaskList();
});
