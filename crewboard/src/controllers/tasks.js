const Task = require('../models/Task');
const Comment = require('../models/Comment');
const ProjectMember = require('../models/ProjectMember');
const svc = require('../services/projects');
const { applyTaskUpdates } = require('../services/taskUpdates');
const { AppError } = require('../middleware/errors');
exports.create = async (req, res) => {
  await svc.membership(req.params.projectId, req.user.id);
  if (req.body.assignee) await checkAssignee(req.params.projectId, req.body.assignee);
  const task = await Task.create({ ...req.body, project: req.params.projectId, createdBy: req.user.id });
  res.status(201).json({ success: true, data: { task } });
};
async function checkAssignee(projectId, userId) {
  if (!await ProjectMember.exists({ project: projectId, user: userId })) throw new AppError(400, 'Assignee must be a project member');
}
exports.update = async (req, res) => {
  const task = await svc.taskForMember(req.params.taskId, req.user.id);
  if (req.body.assignee) await checkAssignee(task.project, req.body.assignee);
  applyTaskUpdates(task, req.body);
  await task.save();
  res.json({ success: true, data: { task } });
};
exports.remove = async (req, res) => {
  const task = await svc.taskForMember(req.params.taskId, req.user.id);
  await Comment.deleteMany({ task: task.id });
  await task.deleteOne();
  res.json({ success: true, data: {} });
};
exports.comments = async (req, res) => {
  const task = await svc.taskForMember(req.params.taskId, req.user.id);
  const comments = await Comment.find({ task: task.id }).populate('author', 'name').sort({ createdAt: 1 });
  res.json({ success: true, data: { comments } });
};
exports.addComment = async (req, res) => {
  const task = await svc.taskForMember(req.params.taskId, req.user.id);
  const comment = await Comment.create({ task: task.id, author: req.user.id, body: req.body.body });
  await comment.populate('author', 'name');
  res.status(201).json({ success: true, data: { comment } });
};
exports.updateComment = async (req, res) => {
  const task = await svc.taskForMember(req.params.taskId, req.user.id);
  const comment = await Comment.findOne({ _id: req.params.commentId, task: task.id });
  if (!comment) throw new AppError(404, 'Comment not found');
  if (String(comment.author) !== req.user.id) throw new AppError(403, 'Only the comment author can edit it');
  comment.body = req.body.body;
  await comment.save();
  res.json({ success: true, data: { comment } });
};
exports.removeComment = async (req, res) => {
  const task = await svc.taskForMember(req.params.taskId, req.user.id);
  const comment = await Comment.findOne({ _id: req.params.commentId, task: task.id });
  if (!comment) throw new AppError(404, 'Comment not found');
  if (String(comment.author) !== req.user.id) throw new AppError(403, 'Only the comment author can delete it');
  await comment.deleteOne();
  res.json({ success: true, data: {} });
};
