const Project = require('../models/Project');
const ProjectMember = require('../models/ProjectMember');
const User = require('../models/User');
const Task = require('../models/Task');
const svc = require('../services/projects');
const { AppError } = require('../middleware/errors');
exports.list = async (req, res) => {
  const memberships = await ProjectMember.find({ user: req.user.id }).populate('project');
  res.json({ success: true, data: { projects: memberships.filter(m => m.project).map(m => ({ ...m.project.toObject(), role: m.role })) } });
};
exports.create = async (req, res) => {
  const project = await Project.create({ ...req.body, owner: req.user.id });
  await ProjectMember.create({ project: project.id, user: req.user.id, role: 'owner' });
  res.status(201).json({ success: true, data: { project } });
};
exports.get = async (req, res) => {
  await svc.membership(req.params.projectId, req.user.id);
  const project = await svc.project(req.params.projectId);
  const members = await ProjectMember.find({ project: project.id }).populate('user', 'name email');
  const tasks = await Task.find({ project: project.id }).populate('assignee', 'name email').sort({ createdAt: -1 });
  res.json({ success: true, data: { project, members: members.map(m => ({ user: m.user, role: m.role })), tasks } });
};
exports.addMember = async (req, res) => {
  await svc.owner(req.params.projectId, req.user.id);
  const user = await User.findOne({ email: req.body.email });
  if (!user) throw new AppError(404, 'No account exists for that email');
  const member = await ProjectMember.findOneAndUpdate({ project: req.params.projectId, user: user.id }, { $setOnInsert: { role: 'member' } }, { upsert: true, new: true, setDefaultsOnInsert: true });
  res.status(201).json({ success: true, data: { member: { user: { id: user.id, name: user.name, email: user.email }, role: member.role } } });
};
exports.removeMember = async (req, res) => {
  await svc.owner(req.params.projectId, req.user.id);
  const member = await ProjectMember.findOne({ project: req.params.projectId, user: req.params.userId });
  if (!member || member.role === 'owner') throw new AppError(404, 'Project member not found');
  await ProjectMember.deleteOne({ _id: member.id });
  await Task.updateMany({ project: req.params.projectId, assignee: req.params.userId }, { $set: { assignee: null } });
  res.json({ success: true, data: {} });
};
exports.remove = async (req, res) => {
  await svc.owner(req.params.projectId, req.user.id);
  await svc.deleteProject(req.params.projectId);
  res.json({ success: true, data: {} });
};
