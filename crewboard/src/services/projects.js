const Project = require('../models/Project');
const ProjectMember = require('../models/ProjectMember');
const Task = require('../models/Task');
const Comment = require('../models/Comment');
const { AppError } = require('../middleware/errors');

async function membership(projectId, userId) {
  const member = await ProjectMember.findOne({ project: projectId, user: userId });
  if (!member) throw new AppError(404, 'Project not found');
  return member;
}
async function owner(projectId, userId) {
  const member = await membership(projectId, userId);
  if (member.role !== 'owner') throw new AppError(403, 'Project owner permission required');
  return member;
}
async function project(projectId) {
  const found = await Project.findById(projectId);
  if (!found) throw new AppError(404, 'Project not found');
  return found;
}
async function taskForMember(taskId, userId) {
  const task = await Task.findById(taskId);
  if (!task) throw new AppError(404, 'Task not found');
  await membership(task.project, userId);
  return task;
}
async function deleteProject(projectId) {
  const tasks = await Task.find({ project: projectId }).select('_id');
  await Comment.deleteMany({ task: { $in: tasks.map(t => t._id) } });
  await Task.deleteMany({ project: projectId });
  await ProjectMember.deleteMany({ project: projectId });
  await Project.deleteOne({ _id: projectId });
}
module.exports = { membership, owner, project, taskForMember, deleteProject };
