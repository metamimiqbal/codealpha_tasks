const editableFields = ['title', 'description', 'status', 'priority', 'dueDate', 'assignee'];

function applyTaskUpdates(task, updates) {
  for (const field of editableFields) {
    if (updates[field] !== undefined) task[field] = updates[field];
  }
  return task;
}

module.exports = { applyTaskUpdates };
