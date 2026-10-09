const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const Task = require('../src/models/Task');
const Member = require('../src/models/ProjectMember');
const Comment = require('../src/models/Comment');
const { applyTaskUpdates } = require('../src/services/taskUpdates');

test('task schema enforces the fixed board statuses and priority values', () => {
  const task = new Task({ title: 'Plan launch', project: new mongoose.Types.ObjectId(), createdBy: new mongoose.Types.ObjectId(), status: 'blocked', priority: 'urgent' });
  const error = task.validateSync();
  assert.ok(error.errors.status);
  assert.ok(error.errors.priority);
});

test('task schema allows one optional member assignee and an optional due date', () => {
  const task = new Task({ title: 'Plan launch', project: new mongoose.Types.ObjectId(), createdBy: new mongoose.Types.ObjectId() });
  assert.equal(task.status, 'todo');
  assert.equal(task.priority, 'medium');
  assert.equal(task.assignee, null);
  assert.equal(task.dueDate, null);
});

test('task schema accepts Done as a destination for completion', () => {
  const task = new Task({ title: 'Ship release', project: new mongoose.Types.ObjectId(), createdBy: new mongoose.Types.ObjectId(), status: 'done' });
  assert.equal(task.validateSync(), undefined);
});

test('project membership has a unique project-user index', () => {
  assert.ok(Member.schema.indexes().some(([keys, options]) => keys.project === 1 && keys.user === 1 && options.unique));
});

test('comments retain a required author reference independent of membership', () => {
  const comment = new Comment({ task: new mongoose.Types.ObjectId(), author: new mongoose.Types.ObjectId(), body: 'Still relevant' });
  assert.equal(comment.validateSync(), undefined);
  assert.ok(Comment.schema.path('author'));
});

test('task updates ignore fields that could change project ownership or provenance', () => {
  const task = { project: 'project-a', createdBy: 'user-a', title: 'Original' };
  applyTaskUpdates(task, { title: 'Updated', project: 'project-b', createdBy: 'user-b', _id: 'other-task' });
  assert.equal(task.title, 'Updated');
  assert.equal(task.project, 'project-a');
  assert.equal(task.createdBy, 'user-a');
  assert.equal(task._id, undefined);
});
