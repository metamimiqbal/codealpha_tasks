const mongoose = require('mongoose');
const schema = new mongoose.Schema({
  task: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true, index: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  body: { type: String, required: true, trim: true, maxlength: 2000 }
}, { timestamps: true });
module.exports = mongoose.model('Comment', schema);
