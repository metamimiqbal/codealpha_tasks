const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { AppError } = require('../middleware/errors');
const cookieOptions = () => ({ httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', maxAge: 7 * 24 * 60 * 60 * 1000 });
const publicUser = user => ({ id: user.id, name: user.name, email: user.email, bio: user.bio });
exports.register = async (req, res) => {
  const { name, email, password } = req.body;
  const user = await User.create({ name, email, passwordHash: await bcrypt.hash(password, 12) });
  const token = jwt.sign({ sub: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
  res.cookie('token', token, cookieOptions()).status(201).json({ success: true, data: { user: publicUser(user) } });
};
exports.login = async (req, res) => {
  const user = await User.findOne({ email: req.body.email }).select('+passwordHash');
  if (!user || !(await bcrypt.compare(req.body.password, user.passwordHash))) throw new AppError(401, 'Email or password is incorrect');
  const token = jwt.sign({ sub: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
  res.cookie('token', token, cookieOptions()).json({ success: true, data: { user: publicUser(user) } });
};
exports.logout = (req, res) => res.clearCookie('token', { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production' }).json({ success: true, data: {} });
exports.me = (req, res) => res.json({ success: true, data: { user: publicUser(req.user) } });
exports.updateProfile = async (req, res) => {
  if (req.body.email && req.body.email !== req.user.email) {
    if (await User.exists({ email: req.body.email })) throw new AppError(409, 'Email is already in use');
  }
  for (const field of ['name', 'email', 'bio']) if (req.body[field] !== undefined) req.user[field] = req.body[field];
  await req.user.save();
  res.json({ success: true, data: { user: publicUser(req.user) } });
};
